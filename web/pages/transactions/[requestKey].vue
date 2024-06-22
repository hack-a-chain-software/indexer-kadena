<script setup lang="ts">
import { gql } from 'nuxt-graphql-request/utils';
import { TabPanel } from '@headlessui/vue'

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Transaction Details'
})

const data = reactive({
  tabs: [
    {
      key: 'overview',
      label: 'Overview',
    },
    {
      key: 'meta',
      label: 'Meta',
    },
    {
      key: 'output',
      label: 'Transaction Output',
    },
    {
      key: 'events',
      label: 'Events',
    },
  ],
})

const query = gql`
  query GetTransactionById($requestKey: String!) {
    transactionByRequestKey(
      requestkey: $requestKey
      transferLimit: 20
      eventLimit: 20
    ) {
      transfers {
        contract {
          chainId
          createdAt
          id
          metadata
          network
          module
          precision
          tokenId
          updatedAt
          type
        }
        transfer {
          amount
          chainId
          contractId
          createdAt
          fromAcct
          hasTokenId
          modulehash
          id
          modulename
          requestkey
          tokenId
          toAcct
          payloadHash
          network
          updatedAt
          type
          transactionId
        }
      }
      transaction {
        blockId
        chainId
        code
        continuation
        createdAt
        creationtime
        data
        gas
        gaslimit
        gasprice
        hash
        id
        logs
        metadata
        numEvents
        nonce
        payloadHash
        pactid
        requestkey
        proof
        rollback
        result
        step
        sigs
        sender
        updatedAt
        ttl
        txid
      }
      events {
        chainId
        createdAt
        id
        module
        modulehash
        params
        name
        paramtext
        payloadHash
        qualname
        requestkey
        transactionId
        updatedAt
      }
    }
  }
`

const route = useRoute();

const { $graphql } = useNuxtApp();

const { data: transaction } = await useAsyncData('GetTransactionById', async () => {
  try {
    const {
      transactionByRequestKey
    } = await $graphql.default.request(query, {
      requestKey: route.params.requestKey,
    });

    return transactionByRequestKey
  } catch (e) {
    console.warn('error', e);

    return;
  }
});

if (!transaction.value) {
  await navigateTo('/404')
}
</script>

<template>
  <PageRoot
    v-if="transaction"
  >
    <PageTitle>
      Transaction Details
    </PageTitle>

    <PageContainer>
      <TransactionDetails
        v-bind="transaction.transaction"
      />
    </PageContainer>

    <PageContainer>
      <Tabs
        :tabs="data.tabs"
      >
        <TabPanel>
          <TransactionOverview
            v-bind="transaction.transaction"
            :transfers="transaction.transfers"
          />
        </TabPanel>

        <TabPanel>
          <TransactionMeta
            v-bind="transaction.transaction"
          />
        </TabPanel>

        <TabPanel>
          <TransactionOutput
            v-bind="transaction.transaction"
          />
        </TabPanel>

        <TabPanel>
          <TransactionEvents
            v-bind="transaction"
          />
        </TabPanel>
      </Tabs>
    </PageContainer>
  </PageRoot>
</template>

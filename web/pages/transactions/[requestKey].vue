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
  query GetTransactionById($id: Int!) {
    transactionById(id: $id) {
      chainId
      continuation
      code
      createdAt
      creationtime
      gas
      data
      gasprice
      gaslimit
      updatedAt
      txid
      step
      rollback
      ttl
      sender
      sigs
      result
      proof
      requestkey
      payloadHash
      pactid
      numEvents
      nodeId
      nonce
      logs
      metadata
      id
      blockId
      blockByBlockId {
        adjacents
        createdAt
        chainwebVersion
        epochStart
        creationTime
        featureFlags
        hash
        height
        id
        nodeId
        nonce
        target
        parent
        payloadHash
        updatedAt
        weight
      }
      eventsByTransactionId {
        nodes {
          updatedAt
          transactionId
          requestkey
          qualname
          paramtext
          params
          payloadHash
          nodeId
          modulehash
          module
          name
          createdAt
          id
        }
      }
      transfersByTransactionId {
        nodes {
          updatedAt
          transactionId
          tokenId
          requestkey
          toAcct
          payloadHash
          nodeId
          modulename
          modulehash
          id
          createdAt
          amount
          fromAcct
          contractByContractId {
            nodeId
            metadata
            module
            tokenId
          }
        }
      }
    }
  }
`

const route = useRoute();

const { $graphql } = useNuxtApp();

const { data: transaction, pending } = await useAsyncData('GetTransactionById', async () => {
  try {
    const {
      transactionById
    } = await $graphql.default.request(query, {
      id: 5076570,
    });

    return transactionById
  } catch (e) {
    console.warn('error', e);

    return;
  }
});

console.log('route', transaction.value)

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
        v-bind="transaction"
      />
    </PageContainer>

    <PageContainer>
      <Tabs
        :tabs="data.tabs"
      >
        <TabPanel>
          <TransactionOverview
            v-bind="transaction"
            :transfers="transaction?.transfersByTransactionId?.nodes || []"
          />
        </TabPanel>

        <TabPanel>
          <TransactionMeta
            v-bind="transaction"
          />
        </TabPanel>

        <TabPanel>
          <TransactionOutput
            v-bind="transaction"
          />
        </TabPanel>

        <TabPanel>
          <TransactionEvents
            :events="transaction?.eventsByTransactionId?.nodes || []"
          />
        </TabPanel>
      </Tabs>
    </PageContainer>
  </PageRoot>
</template>

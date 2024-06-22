<script setup lang="ts">
import { gql } from 'nuxt-graphql-request/utils';

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Token Transfers'
})

const {
  tokenTransfersTableColumns
} = useAppConfig()

const query = gql`
  query GetTokenTransfers($first: Int, $offset: Int) {
    allTransfers(condition: {tokenId: null}, offset: $offset, orderBy: ID_DESC, first: $first) {
      nodes {
        tokenId
        updatedAt
        transactionId
        toAcct
        requestkey
        payloadHash
        nodeId
        modulehash
        modulename
        chainId
        createdAt
        fromAcct
        amount
      }
      pageInfo {
        startCursor
        hasPreviousPage
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`

const key = 'allTransfers'

const { $graphql } = useNuxtApp();

const page = ref(1)
const limit = ref(20)

const { data: transfers, pending } = useAsyncData('all-token-transfers', async () => {
  const res = await $graphql.default.request(query, {
    first: limit.value,
    offset: (page.value - 1) * 20,
  });

  const transfers = res[key]

  const totalPages = Math.max(Math.ceil(transfers.totalCount / limit.value), 1)

  return {
    totalPages,
    totalCount: transfers.totalCount,
    pageInfo: transfers.pageInfo,
    nodes: transfers.nodes.map((transfer: any) => {
      const metadata = staticTokens.find(({ module }) => module === transfer.modulename) || unknownToken

      return {
        ...transfer,
        metadata,
      }
    }),
  };
}, {
  watch: [page]
});
</script>

<template>
  <PageRoot>
    <PageTitle>
      Token Transfers
    </PageTitle>

    <TableContainer>
      <TableRoot
        :pending="pending"
        title="Latest Transactions"
        :rows="transfers?.nodes || []"
        :columns="tokenTransfersTableColumns"
      >
        <template #method>
          <Chip />
        </template>

        <template #requestkey="{ row }">
          <ColumnLink
            :label="row.requestkey"
            :to="`/transactions/${row.id}`"
          />
        </template>

        <template #from="{ row }">
          <ColumnAddress
            :value="row.fromAcct"
          />
        </template>

        <template #to="{ row }">
          <ColumnAddress
            :value="row.toAcct"
          />
        </template>

        <template #token="{ row }">
          <ColumnToken
            v-bind="row.metadata"
          />
        </template>

        <template #date="{ row }">
          <ColumnDate
            :row="row"
          />
        </template>

        <template #icon>
          <div
            class="w-6 h-full group hover:bg-gray-500 rounded grid items-center justify-center"
          >
            <IconEye
              class="mx-auto text-white group-hover:text-kadscan-500 transition"
            />
          </div>
        </template>

        <template
          #empty
        >
          <EmptyTable
            image="/empty/txs.png"
            title="No latest token transactions found yet"
            description="We couldn't find any trending tokens"
          />
        </template>

        <template
          #footer
        >
          <PaginateTable
            itemsLabel="Transfers"
            :currentPage="page"
            :totalItems="transfers?.totalCount ?? 1"
            :totalPages="transfers?.totalPages"
            @pageChange="page = Number($event)"
          />
        </template>
      </TableRoot>
    </TableContainer>
  </PageRoot>
</template>

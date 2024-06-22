<script setup lang="ts">
import { gql } from 'nuxt-graphql-request/utils';

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'NFT Transfers'
})

const {
  nftTransfersTableColumns
} = useAppConfig()

const query = gql`
  query GetNftTransfers($first: Int, $offset: Int) {
    allTransfers(
      condition: {hasTokenId: true}
      offset: $offset
      orderBy: ID_DESC
      first: $first
    ) {
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
        id
        chainId
        createdAt
        fromAcct
        amount
        contractByContractId {
          id
          metadata
          module
          tokenId
        }
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

const {
  page,
  pending,
  data: transfers,
} = await usePaginate({
  query,
  key: 'allTransfers'
})

console.log('transfers', transfers.value)
</script>

<template>
  <PageRoot>
    <PageTitle>
      NFT Transfers
    </PageTitle>

    <TableContainer>
      <TableRoot
        title="Latest Transactions"
        :pending="pending"
        :rows="transfers?.nodes || []"
        :columns="nftTransfersTableColumns"
      >
        <template #method>
          <Chip />
        </template>

        <template #hash="{ row }">
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

        <template #date="{ row }">
          <ColumnDate
            :row="row"
          />
        </template>

        <template #item="{ row }">
          <ColumnNft
            :contract="row.contractByContractId"
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
            title="No latest transfers found yet"
            description="We couldn't find any latest transfers"
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

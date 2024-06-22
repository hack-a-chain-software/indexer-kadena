<script setup lang="ts">
import { gql } from 'nuxt-graphql-request/utils';

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Transactions'
})

const {
  transactionTableColumns
} = useAppConfig()

const query = gql`
  query GetTransactions($first: Int, $offset: Int) {
    allTransactions(offset: $offset, orderBy: ID_DESC, first: $first) {
      nodes {
        chainId
        code
        createdAt
        continuation
        creationtime
        data
        gas
        gaslimit
        gasprice
        id
        metadata
        blockId
        logs
        nonce
        nodeId
        numEvents
        pactid
        payloadHash
        proof
        requestkey
        result
        sender
        rollback
        step
        ttl
        txid
        updatedAt
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
  }
`

const {
  page,
  pending,
  data: transactions,
} = await usePaginate({
  query,
  key: 'allTransactions'
})

console.log('transactions', transactions.value)
</script>

<template>
  <PageRoot>
    <PageTitle>
      Transactions
    </PageTitle>

    <!-- <div
      class="grid gap-3 bazk:grid-cols-4 bazk:gap-6"
    >
      <Card
        label="Market Capital"
        :description="moneyCompact.format(blockchain?.kadena.market_cap)"
      />

      <Card
        label="Volume (24h)"
        :description="moneyCompact.format(blockchain?.kadena.volume_24h)"
      />

      <Card
        description="-"
        label="Transactions (24h)"
      />

      <Card
        :description="transactions.totalCount ?? 0"
        label="Total transactions (All time)"
      />
    </div> -->

    <TableContainer>
      <TableRoot
        title="Recent Transactions"
        :pending="pending"
        :rows="transactions?.nodes || []"
        :columns="transactionTableColumns"
      >
        <template #status="{ row }">
          <ColumnStatus
            :row="row"
          />
        </template>

        <template #requestKey="{ row }">
          <ColumnLink
            :label="row.requestkey"
            :to="`/transactions/${row.id}`"
          />
        </template>

        <template #createdAt="{ row }">
          <ColumnDate
            :row="row"
          />
        </template>

        <template #sender="{ row }">
          <ColumnAddress
            :value="row.sender"
          />
        </template>

        <template #block="{ row }">
          <ColumnLink
            :to="`/blocks/${row.blockId ?? 'null'}`"
            :label="row.blockId ?? 'null'"
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
            title="No transactions found yet"
            description="We couldn't find any recent transactions"
          />
        </template>

        <template
          #footer
        >
          <PaginateTable
            :currentPage="page"
            :totalItems="transactions.totalCount ?? 1"
            :totalPages="transactions.totalPages"
            @pageChange="page = Number($event)"
          />
        </template>
      </TableRoot>
    </TableContainer>
  </PageRoot>
</template>

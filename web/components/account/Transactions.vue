<script setup lang="ts">
import { gql } from 'nuxt-graphql-request/utils';

const props = defineProps<{
  address: string;
}>()

const {
  accountTransactionsTableColumns
} = useAppConfig()

const query = gql`
  query GetTransactions($first: Int, $offset: Int, $sender: String) {
    allTransactions(offset: $offset, orderBy: ID_DESC, first: $first, filter: {sender: { equalTo: $sender }}) {
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

const data = reactive({
  page: 1,
  limit: 20
})

const { $graphql } = useNuxtApp();

const key = 'allTransactions'

const { data: transactions, pending } = useAsyncData(key, async () => {
  const res = await $graphql.default.request(query, {
    first: data.limit,
    offset: (data.page - 1) * 20,
    sender: props.address,
  });

  const totalPages = Math.max(Math.ceil(res[key].totalCount / data.limit), 1)

  return {
    ...res[key],
    totalPages
  };
}, {
  watch: [() => data.page]
});
</script>

<template>
  <PageRoot>
    <div
      class="py-3 md:p-6 rounded-lg md:rounded-2xl border border-gray-300"
    >
      <TableRoot
        :pending="pending"
        :rows="[]"
        :columns="accountTransactionsTableColumns"
      >
        <template #status="{ row }">
          <ColumnStatus
            :key="'status-' + row.requestkey"
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
            title="No transactions found for this account"
            description="We couldn't find any transactions for this account"
          />
        </template>

        <template
          #footer
        >
          <PaginateTable
            :currentPage="data.page"
            :totalItems="transactions?.totalCount ?? 1"
            :totalPages="transactions?.totalPages"
            @pageChange="data.page = Number($event)"
            class="p-3"
          />
        </template>
      </TableRoot>
    </div>
  </PageRoot>
</template>

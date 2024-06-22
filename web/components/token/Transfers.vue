<script setup lang="ts">
import { gql } from 'nuxt-graphql-request/utils';

const props = defineProps<{
  modulename?: string,
}>()

const {
  tokenDetailTransferTableColumns
} = useAppConfig()

const query = gql`
  query GetTransactions($first: Int, $offset: Int, $modulename: String!) {
    allTransfers(offset: $offset, orderBy: ID_DESC, first: $first, condition: {modulename: $modulename}) {
      nodes {
        requestkey
        amount
        createdAt
        fromAcct
        toAcct
        chainId
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

const key = 'allTransfers'

const { data: transfers, pending } = useAsyncData('token-details-transfers', async () => {
  const res = await $graphql.default.request(query, {
    first: data.limit,
    offset: (data.page - 1) * 20,
    modulename: props.modulename ?? 'coin'
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
  <div
    class="py-3 md:p-6 rounded-lg md:rounded-2xl border border-gray-300"
  >
    <TableRoot
      :pending="pending"
      id="token-transfers-table"
      :rows="transfers?.nodes ?? []"
      :columns="tokenDetailTransferTableColumns"
    >
      <template #method>
        <Chip />
      </template>

      <template #requestKey="{ row }">
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

      <template
        #empty
      >
        <EmptyTable
          image="/empty/txs.png"
          title="No transfers found yet"
          description="We couldn't find transfer"
        />
      </template>

      <template
        #footer
      >
        <PaginateTable
          :currentPage="data.page"
          :totalItems="transfers?.totalCount ?? 1"
          :totalPages="transfers?.totalPages"
          @pageChange="data.page = Number($event)"
          class="p-3"
        />
      </template>
    </TableRoot>
  </div>
</template>

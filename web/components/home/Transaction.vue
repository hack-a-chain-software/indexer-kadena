<script setup lang="ts">
import { format } from 'date-fns'

const props = defineProps<{
  id?:string | number,
  gas: string,
  nodeId: string,
  sender: string,
  result: string,
  chainId: number,
  createdAt: string,
  requestkey: string,
  // transfersByTransactionId: any
}>()

const status = useTransactionStatus(props.result)

// const lastTransfer = useLatestTransfer(props.transfersByTransactionId.nodes)
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3 xl:gap-4 py-3 border-b lg:h-[111px] border-b-gray-300 xl:max-h-[82px]"
  >
    <IconStatus
      :status="status"
    />

    <div
      class="flex xl:flex-col gap-4 grow"
    >
      <Value
        isLink
        label="Request Key"
        :to="`/transactions/${props.id}`"
        :value="shortenString(props.requestkey)"
      />

      <Value
        label="Chain"
        :value="props.chainId"
      />
    </div>

    <div
      class="flex xl:flex-col gap-4 xl:mx-auto grow"
    >
      <Value
        isLink
        label="Sender"
        :to="`/account/${sender}`"
        :value="shortenAddress(sender)"
      />

      <Value
        label="Gas"
        :value="gas"
      />
    </div>

    <div
      class="flex flex-row-reverse justify-between w-full xl:w-auto xl:justify-start xl:flex-col items-end gap-4 xl:ml-auto"
    >
      <!-- <div
        class="flex px-2 py-1 border border-gray-300 rounded"
      >
        <span
          class="text-font-450 text-xs"
        >
          {{ `${Number(lastTransfer?.amount).toPrecision(2)} ${lastTransfer?.modulename}`}}
        </span>
      </div> -->

      <Value
        :value="format(new Date(props.createdAt), 'dd MMM y HH:mm:ss')"
      />
    </div>
  </div>
</template>

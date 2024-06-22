<script setup lang="ts">

const props = defineProps<{
  id?: number,
  nodeId: string,
  result: string,
  chainId: number,
  requestkey: string,
}>()

const status = useTransactionStatus(props.result)
</script>

<template>
  <NuxtLink
    :to="`/transactions/${id}`"
    class="py-3 border-b border-gray-300 flex gap-2 hover:opacity-[0.8]"
  >
    <IconStatus
      :status="status"
      class="mb-auto xl:mb-0 w-[28px] h-[28px]"
    />

    <div
      class="flex flex-col"
    >
      <span
        class="text-font-400 text-sm"
      >
        {{ requestkey }}
      </span>

      <div>
        <span
          class="text-font-500 text-xs"
        >
          Chain Id: {{ chainId }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  code: any;
  result: string,
  sender: string,
  chainId: number,
  gasprice: string,
  createdAt: string,
  requestkey: string,
  continuation: string;
  transfers: any;
}>()

const {
  blockchainTooltipData
} = useAppConfig()
</script>

<template>
  <Divide>
    <DivideScroll
      class="max-h-[360px]"
      v-if="transfers?.length > 0"
    >
      <div
        class="grid gap-2"
        v-for="transfer in transfers"
        :key="'transfer:' + transfer.id"
      >
        <LabelValue
          withCopy
          label="From"
          :value="transfer.fromAcct"
          :description="blockchainTooltipData.transaction.overview.from"
        />

        <LabelValue
          withCopy
          label="To"
          :value="transfer.toAcct"
          :description="blockchainTooltipData.transaction.overview.to"
        />

        <TransactionNFT
          v-if="transfer.contractByContractId"
          :contract="transfer.contractByContractId"
        />

        <TransactionToken
          v-else
          v-bind="transfer"
        />
      </div>
    </DivideScroll>

    <DivideItem>
      <LabelValue
        label="Transaction Fee"
        :value="`${gasprice} KDA`"
        :description="blockchainTooltipData.transaction.overview.transactionFee"
      />

      <LabelValue
        withCopy
        label="Paid by"
        :value="sender"
        :description="blockchainTooltipData.transaction.overview.paidBy"
      />
    </DivideItem>

    <DivideItem>
      <LabelValue
        label="Gas Price"
        :value="`${gasprice} KDA`"
        :description="blockchainTooltipData.transaction.overview.gasPrice"
      />
    </DivideItem>

    <DivideItem>
      <LabelValue
        label="Code"
        :description="blockchainTooltipData.transaction.overview.code"
      >
        <template #value>
          <HighlightValue>
            {{ code }}
          </HighlightValue>
        </template>
      </LabelValue>
    </DivideItem>
  </Divide>
</template>

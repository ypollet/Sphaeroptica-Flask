<script setup lang="ts">
import  { LandmarkImage } from '@/data/models/landmark_image';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'vue';
import { ref } from 'vue';

const props = defineProps<{
  modelValue: LandmarkImage
  class?: HTMLAttributes['class']
}>()

const image = ref<HTMLImageElement | null>(null)


const emits = defineEmits<{
  (e: 'update:dimensions', dimensions: number[]): void
}>()
let val = 0
</script>

<template>
<img ref="image" :class="cn('object-fit', props.class)" :src="props.modelValue.image" :alt="props.modelValue.name" aspect-ratio="auto" draggable="false">
</template>

<style scoped>
.object-fit {
  object-fit: contain;
  display:block;
}
</style>
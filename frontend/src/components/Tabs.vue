<script setup lang="ts">
import CameraViewer from "@/components/ui/camera-viewer/CameraViewer.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Button from "./ui/button/Button.vue";
import { X } from "lucide-vue-next";
import { useLandmarkImagesStore, DEFAULT_TAB } from "@/lib/stores";
import ImageViewer from "@/components/ui/image-viewer/ImageViewer.vue";
import { storeToRefs } from "pinia";
import { ScrollBar, ScrollArea } from "./ui/scroll-area/";

const imageStore = useLandmarkImagesStore()

const { getTabName } = storeToRefs(imageStore)
console.log(getTabName.value)
console.log(imageStore.images)

function removeTab(index: number) {
  imageStore.images.splice(index, 1)
  if (imageStore.images.length == 0) {
    imageStore.selected = -1
    return;
  }
  if (index >= imageStore.images.length) {
    imageStore.selected = imageStore.images.length - 1
    return;
  }
  imageStore.selected = index
}

function onTabChange(value: string | number) {
  console.log("New val : " + value)
  imageStore.setTab(value.toString())
}
</script>
<template>
  <Tabs :model-value="getTabName" @update:model-value="onTabChange" class="w-full h-full">
    <ScrollArea class="w-full tabs">
      <TabsList class="tabs-list space-x-2 p-2">
        <TabsTrigger :value="DEFAULT_TAB" class="flex justify-center items-end p-2">
          Virtual Camera
        </TabsTrigger>
        <TabsTrigger v-for="(image, index) in imageStore.images" :value="image.name"
          class="flex justify-center items-end p-2">
          {{ image.name }}
          <Button variant="ghost" class="h-4 w-4 p-0 ml-2" @click="removeTab(index)">
            <X />
          </Button>
        </TabsTrigger>
      </TabsList>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
    <TabsContent value="viewer" class="image m-0">
      <div class=" h-full w-full flex items-center justify-center">
        <CameraViewer />
      </div>
    </TabsContent>
      <TabsContent :value="image.name" class="image m-0" v-for="image in imageStore.images">
          <ImageViewer :model-value="image" />
      </TabsContent>
  </Tabs>

</template>

<style scoped>
.tabs {
  height: 70px;
}

.tabs-list {
  height: 60px;
}

.image {
  height: calc(100% - 70px);
}
</style>@/components/ui/camera-viewer/CameraViewer.vue@/components/ui/camera-viewer/ImageViewer.vue
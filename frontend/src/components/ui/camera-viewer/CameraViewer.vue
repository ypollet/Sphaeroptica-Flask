<script setup lang="ts">
import * as math from 'mathjs'
import { degreesToRad } from '@/lib/utils'

import { ref, watch, onMounted, type Ref } from 'vue';

import { Loader2 } from 'lucide-vue-next';

import { useQuery } from '@tanstack/vue-query'

import { useLandmarkImagesStore, useVCImagesStore, useVirtualCameraStore, useLandmarksStore } from '@/lib/stores';

import type { Coordinates } from '@/data/models/coordinates'
import { LandmarkImage } from '@/data/models/landmark_image'
import type { VirtualCameraImage } from '@/data/models/virtual_camera_image'

import { RepositoryFactory } from '@/data/repositories/repository_factory'
import { repositorySettings } from "@/config/appSettings"


const LONG_MAX = 360
const LONG_MIN = 0

const landmarksImageStore = useLandmarkImagesStore()
const imageStore = useVCImagesStore()
const cameraStore = useVirtualCameraStore()

const imageContainer = ref<HTMLDivElement | null>(null)

const selectedImage: Ref<string> = ref("")
const selectedImageName: Ref<string> = ref("")

cameraStore.$subscribe(() => {
  console.log("Change Camera")
  setNearestImage(cameraStore.toRad)
})

const { isPending, isError, data, error } = useQuery({
  queryKey: ['all_images'],
  queryFn: () => getImages(),
})
console.log(data.value)
watch(data, () => {
  setNearestImage(cameraStore.toRad)
})

var isPressed: boolean = false

const repository = RepositoryFactory.get(repositorySettings.type)

function getImages(): Promise<Array<VirtualCameraImage>> {
  return repository.getImages(imageStore.objectPath).then((images) => {
    console.log("images : length = " + images.length)

    // Set Latitude Values
    images.forEach((image: VirtualCameraImage) => {
      if (image.latitude < imageStore.latMin) {
        imageStore.latMin = image.latitude
      }
      if (image.latitude > imageStore.latMax) {
        imageStore.latMax = image.latitude
      }
    })
    return images

  })
}

function setNearestImage(radPos: number[]) {
  if (data.value) {
    let bestAngle: Number = Infinity;
    let bestImage: VirtualCameraImage | null = null

    data.value.forEach((imageData: VirtualCameraImage) => {
      let imgPos: [number, number] = [degreesToRad(imageData.longitude), degreesToRad(imageData.latitude)]
      let sinus: number = math.sin(imgPos[1]) * math.sin(radPos[1])
      let cosinus: number = math.cos(imgPos[1]) * math.cos(radPos[1]) * math.cos(math.abs(imgPos[0] - radPos[0]))
      let centAngle: Number = math.acos(sinus + cosinus) as Number
      if (centAngle < bestAngle) {
        bestAngle = centAngle
        bestImage = imageData
      }
    })

    if (bestImage === null) {
      return;
    }
    var imageData: VirtualCameraImage = bestImage
    selectedImage.value = imageData.image
    selectedImageName.value = imageData.name
  }

}

function mouseEnter(event: MouseEvent) {
  isPressed = true
}
function mouseMove(event: MouseEvent) {
  if (isPressed) {
    let pos: Coordinates = { x: event.movementX, y: event.movementY }
    cameraStore.setLongitude(((pos.x) / 5), LONG_MIN, LONG_MAX)
    cameraStore.setLatitude(((pos.y) / 5), imageStore.latMin, imageStore.latMax)
  }
}
function mouseLeave() {
  isPressed = false
}

async function selectImage() {
  let image: LandmarkImage = await repository.getImage(imageStore.objectPath, selectedImageName.value)
  landmarksImageStore.addImage(image)
}

setNearestImage(cameraStore.toRad)

</script>
<template>
  <div class="w-full h-full border flex justify-center items-center">
    <div v-if="isPending" class="w-full h-full flex justify-center items-center">
      <Loader2 class="animate-spin mr-10" width="10%" height="10%" />
    </div>
    <div v-if="isError" class="w-full h-full flex justify-center items-center">
      <div class="text-red-600">{{ error }}</div>
    </div>
    <div v-if="data" ref="imageContainer" class="w-full h-full flex justify-center items-center">
      <img class="object-fit" @mousedown="mouseEnter" @mouseup="mouseLeave" @mousemove="mouseMove"
        @mouseleave="mouseLeave" @dblclick="selectImage()" :src="selectedImage" alt="album.name" aspect-ratio="auto"
        draggable="false">
    </div>
  </div>
</template>

<style scoped>
.object-fit {
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
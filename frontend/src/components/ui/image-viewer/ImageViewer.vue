<script setup lang="ts">
import { ref, onMounted, nextTick, type HTMLAttributes, watch, version } from 'vue'
import { cn, ZOOM_MAX, ZOOM_MIN, DOT_RADIUS, SPACE_TARGET } from '@/lib/utils'
import { type Coordinates } from "@/data/models/coordinates"
import { LandmarkImage } from "@/data/models/landmark_image"
import { Landmark } from "@/data/models/landmark"
import { useLandmarksStore, useVCImagesStore } from '@/lib/stores'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { RepositoryFactory } from '@/data/repositories/repository_factory'
import { repositorySettings } from "@/config/appSettings"


const repository = RepositoryFactory.get(repositorySettings.type)

const landmarksStore = useLandmarksStore()
const imageStore = useVCImagesStore()

function computeReprojection(landmark: Landmark) {
  const path = 'http://localhost:5000/reproject';
  console.log("Reprojection for " + landmark.id)
  if (landmark.position) {
    repository.computeReprojection(imageStore.objectPath, landmark.position, props.modelValue.name).then((pose) => {
      props.modelValue.reprojections.set(landmark.id, pose)
      update()
    }).catch((error) => {
      console.error(error);
    });
  }
}

function checkVersions() {
  landmarksStore.landmarks.forEach((landmark, index) => {
    if (props.modelValue.versions.get(landmark.id) == null || props.modelValue.versions.get(landmark.id) !== landmark.getVersion()) {
      props.modelValue.versions.set(landmark.id, landmark.getVersion())

      if (landmark.position != null) {
        computeReprojection(landmark)
      } else {
        // automatically delete key just in case
        props.modelValue.reprojections.delete(landmark.id)
      }
    }
  })
}
landmarksStore.$subscribe((mutation, state) => {
  checkVersions()
  update()
})

const props = defineProps<{
  modelValue: LandmarkImage
  class?: HTMLAttributes['class']
}>()

const imageContainer = ref<HTMLDivElement | null>(null)
const base_image = ref<HTMLImageElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const shiftCanvas = ref<Coordinates>({ x: 0, y: 0 })
const dragging = ref<boolean>(false)
const landmarkDragged = ref<Landmark | null>(null)
const draggedPos = ref<Coordinates>({ x: -1, y: -1 })
const posContextMenu = ref<Coordinates>({ x: -1, y: -1 })
const contextMenuOpen = ref<boolean>(false)

const degrees_to_radians = (deg: number) => (deg * Math.PI) / 180.0; // Convert degrees to radians using the formula: radians = (degrees * Math.PI) / 180

onMounted(() => {
  const resizeObserver = new ResizeObserver(function () {
    if (imageContainer.value && canvas.value && base_image.value) {
      canvas.value.width = Math.floor(imageContainer.value.clientWidth)
      canvas.value.height = Math.floor(imageContainer.value.clientHeight)
      update()
    }

  });
  if (imageContainer.value) {
    resizeObserver.observe(imageContainer.value);
  }
  checkVersions()
})

function loaded() {
  nextTick(() => {
    if (props.modelValue.zoom <= 0) {
      screenFit()
    }
    update()
  })
}

function drawImage() {
  if (canvas.value && base_image.value && base_image.value.complete && props.modelValue.zoom > 0) {
    let ctx = canvas.value.getContext("2d")!

    ctx.scale(props.modelValue.zoom, props.modelValue.zoom)

    ctx.translate(props.modelValue.offset.x, props.modelValue.offset.y)

    shiftCanvas.value = {
      x: Math.max(0, (canvas.value.width - base_image.value.naturalWidth * props.modelValue.zoom) / 2) / props.modelValue.zoom,
      y: Math.max(0, (canvas.value.height - base_image.value.naturalHeight * props.modelValue.zoom) / 2) / props.modelValue.zoom
    }
    ctx.drawImage(base_image.value, 0, 0, base_image.value.naturalWidth, base_image.value.naturalHeight,
      shiftCanvas.value.x, shiftCanvas.value.y, base_image.value.naturalWidth, base_image.value.naturalHeight)

    landmarksStore.landmarks.forEach((landmark, id) => {
      let marker = landmark.getPoses().get(props.modelValue.name)
      let radius = DOT_RADIUS / props.modelValue.zoom
      if (!marker && !landmark.equals(landmarkDragged.value)) {
        //if there  is no pose on the image, check position
        marker = props.modelValue.reprojections.get(landmark.id)
        if (marker != undefined) {
          // draw reprojections already computed
          ctx.beginPath();
          ctx.arc((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y), radius, 0, 2 * Math.PI);
          ctx.fillStyle = landmark.getColorHEX()
          ctx.fill();
          ctx.lineWidth = DOT_RADIUS / 2 / props.modelValue.zoom;
          ctx.strokeStyle = "white";
          ctx.stroke();
          ctx.closePath()
        }
        return
      }
      ctx.beginPath();
      if (landmark.equals(landmarkDragged.value)) {
        marker = draggedPos.value
        const targetRadius = radius * 4
        // draw circle
        ctx.arc((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y), targetRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = DOT_RADIUS / 2 / props.modelValue.zoom;
        ctx.stroke()
        ctx.closePath();

        // draw white lines diagonals
        ctx.beginPath();
        let start: Coordinates = posCircle(marker, 45, targetRadius, shiftCanvas.value);
        let end: Coordinates = posCircle(marker, 45, targetRadius * SPACE_TARGET, shiftCanvas.value);
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)

        start = posCircle(marker, 135, targetRadius, shiftCanvas.value);
        end = posCircle(marker, 135, targetRadius * SPACE_TARGET, shiftCanvas.value);
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)

        start = posCircle(marker, 225, targetRadius, shiftCanvas.value);
        end = posCircle(marker, 225, targetRadius * SPACE_TARGET, shiftCanvas.value);
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)

        start = posCircle(marker, 315, targetRadius, shiftCanvas.value);
        end = posCircle(marker, 315, targetRadius * SPACE_TARGET, shiftCanvas.value);
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)

        ctx.strokeStyle = 'white';
        ctx.lineWidth = DOT_RADIUS / 3 / props.modelValue.zoom;

        ctx.stroke()
        ctx.closePath();

        // draw black lines lines horizontal and vertical
        ctx.beginPath();

        //horizontal
        ctx.moveTo((marker.x + shiftCanvas.value.x) + (targetRadius * (1 - SPACE_TARGET)), (marker.y + shiftCanvas.value.y))
        ctx.lineTo((marker.x + shiftCanvas.value.x) + (targetRadius * SPACE_TARGET), (marker.y + shiftCanvas.value.y))

        ctx.moveTo((marker.x + shiftCanvas.value.x) - (targetRadius * (1 - SPACE_TARGET)), (marker.y + shiftCanvas.value.y))
        ctx.lineTo((marker.x + shiftCanvas.value.x) - (targetRadius * SPACE_TARGET), (marker.y + shiftCanvas.value.y))

        //vertical
        ctx.moveTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) + (targetRadius * (1 - SPACE_TARGET)))
        ctx.lineTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) + (targetRadius * SPACE_TARGET))

        ctx.moveTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) - (targetRadius * (1 - SPACE_TARGET)))
        ctx.lineTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) - (targetRadius * SPACE_TARGET))

        ctx.strokeStyle = 'black';
        ctx.lineWidth = DOT_RADIUS / 3 / props.modelValue.zoom;
        ctx.stroke()
      }
      else {
        // Marker is defined and landmarkDragged not equals landmark
        ctx.arc((marker!.x + shiftCanvas.value.x), (marker!.y + shiftCanvas.value.y), radius, 0, 2 * Math.PI);
        ctx.fillStyle = landmark.getColorHEX()
        ctx.fill();
        ctx.lineWidth = DOT_RADIUS / 2 / props.modelValue.zoom;
        ctx.strokeStyle = "black";
        ctx.stroke();
      }
      ctx.closePath()
    });
  }
}

function posCircle(center: Coordinates, angle: number, radius: number, translate: Coordinates = { x: 0, y: 0 }): Coordinates {
  return { x: (center.x + radius * Math.cos(degrees_to_radians(angle))) + translate.x, y: (center.y + radius * Math.sin(degrees_to_radians(angle))) + translate.y };
}

function update() {
  if (canvas.value && base_image.value && base_image.value.complete) {
    // Clear canvas
    canvas.value.width = canvas.value.width

    // Check that offset values
    updateOffset(0, 0)

    //draw Image
    drawImage()
  }
}

function screenFit() {
  if (base_image.value && base_image.value.complete && imageContainer.value && canvas.value) {
    canvas.value.width = Math.floor(imageContainer.value.clientWidth)
    canvas.value.height = Math.floor(imageContainer.value.clientHeight)

    props.modelValue.zoom = Math.min(imageContainer.value.clientWidth / base_image.value.naturalWidth, imageContainer.value.clientHeight / base_image.value.naturalHeight)
  }
}

function getPos(event: MouseEvent): Coordinates {
  const svgRect = canvas.value!.getBoundingClientRect();
  let x = ((event.pageX - svgRect.left) / props.modelValue.zoom) - props.modelValue.offset.x - shiftCanvas.value.x
  let y = ((event.pageY - svgRect.top) / props.modelValue.zoom) - props.modelValue.offset.y - shiftCanvas.value.y

  return { x: x, y: y }
}

function updateOffset(movementX: number, movementY: number) {
  if (base_image.value && canvas.value) {
    props.modelValue.offset.x = props.modelValue.offset.x + movementX / props.modelValue.zoom
    props.modelValue.offset.y = props.modelValue.offset.y + movementY / props.modelValue.zoom

    //check value
    props.modelValue.offset.x = Math.min(0, Math.max(-((base_image.value.naturalWidth * props.modelValue.zoom) - canvas.value.width) / props.modelValue.zoom, props.modelValue.offset.x))
    props.modelValue.offset.y = Math.min(0, Math.max(-((base_image.value.naturalHeight * props.modelValue.zoom) - canvas.value.height) / props.modelValue.zoom, props.modelValue.offset.y))
  }
}

function updateZoom(zoomDelta: number) {

  props.modelValue.zoom = +(props.modelValue.zoom + (zoomDelta / 50)).toFixed(2)

  //check value
  props.modelValue.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, props.modelValue.zoom))
}


function zoomWithWheel(event: WheelEvent) {
  let oldZoom = props.modelValue.zoom
  updateZoom(Math.sign(-event.deltaY))
  let deltaZoom = props.modelValue.zoom / oldZoom

  //get pos mouse in canvas
  const svgRect = canvas.value!.getBoundingClientRect();
  let mouseX = event.pageX - svgRect.left
  let mouseY = event.pageY - svgRect.top

  //update offset
  let deltaOffsetX = -((svgRect.width * deltaZoom) - svgRect.width) * (mouseX / svgRect.width) // (dest offset - src offset) * ratio of pos mouse
  let deltaOffsetY = -((svgRect.height * deltaZoom) - svgRect.height) * (mouseY / svgRect.height)

  updateOffset(deltaOffsetX, deltaOffsetY)
  update()
}

function startDrag(event: MouseEvent) {
  if (event.button == 0) {
    dragging.value = true
    let pos = getPos(event)
    landmarksStore.landmarks.forEach((landmark, index) => {
      let marker = landmark.getPoses().get(props.modelValue.name) || props.modelValue.reprojections.get(landmark.id)
      if (!marker) {
        //if undefined
        return
      }
      if (pointInsideCircle(pos, marker, DOT_RADIUS / props.modelValue.zoom)) {
        landmarkDragged.value = landmark
      }
    })
  }
}

function mousemove(event: MouseEvent) {
  if (dragging.value == true) {
    if (landmarkDragged.value == null) {
      // no marker to drag => pan image
      updateOffset(event.movementX, event.movementY)
    }
    else {
      // drag marker
      draggedPos.value = getPos(event)
    }

    update()
  }
}

function stopDrag(event: MouseEvent) {
  if (!contextMenuOpen.value) {
    dragging.value = false
    if (landmarkDragged.value != null) {
      //update pos of landmark
      landmarkDragged.value.addPose(props.modelValue.name, getPos(event))

      //triangulate landmark
      landmarkDragged.value.triangulatePosition(imageStore.objectPath)

      // reinit landmarkDrag
      reinitDraggedLandmark()

    }
    update()
  }
}

function closeContextMenu() {
  console.log("close context menu")
  contextMenuOpen.value = false
  reinitDraggedLandmark()
}

function reinitDraggedLandmark() {
  landmarkDragged.value = null
  draggedPos.value = { x: -1, y: -1 }
}

function printPos(event: MouseEvent) {
  let pos = getPos(event)
  console.log("Position = ", pos.x, " : ", pos.y)
}

function pointInsideCircle(pointCoord: Coordinates, circleCoord: Coordinates, radius: number) {
  const distance =
    Math.sqrt((pointCoord.x - circleCoord.x) ** 2 + (pointCoord.y - circleCoord.y) ** 2);
  return distance < radius;
}

function onImage(pos: Coordinates): boolean {
  if (base_image.value) {
    return pos.x >= 0 && pos.y >= 0 && pos.x <= base_image.value.naturalWidth && pos.y <= base_image.value.naturalHeight
  }
  return false
}

function openContextMenu(event: MouseEvent) {
  console.log("Start context")
  contextMenuOpen.value = true
  posContextMenu.value = getPos(event)
  if (!onImage(posContextMenu.value)) {
    // Don't show context menu if image not clicked
    event.preventDefault()
    return;
  }
  let pos = getPos(event)
  landmarksStore.landmarks.forEach((landmark, index) => {
    let marker = landmark.getPoses().get(props.modelValue.name)
    if (!marker) {
      //if undefined
      return
    }
    if (pointInsideCircle(pos, marker, DOT_RADIUS / props.modelValue.zoom)) {
      landmarkDragged.value = landmark
    }
  })

}

function clickContext(landmark: Landmark) {
  landmark.addPose(props.modelValue.name, { x: posContextMenu.value.x, y: posContextMenu.value.y })
  //triangulate landmark
  landmark.triangulatePosition(imageStore.objectPath)
  update()
  // reinit landmarkDrag
  reinitDraggedLandmark()
}

function addLandmark() {
  let id = landmarksStore.generateID()
  let landmark = new Landmark(id, id)
  landmarksStore.addLandmark(landmark);
  landmark.addPose(props.modelValue.name, { x: posContextMenu.value.x, y: posContextMenu.value.y })
  update()
}

function deleteLandmark(landmark: Landmark) {
  landmark.removePose(props.modelValue.name)
  landmark.triangulatePosition(imageStore.objectPath)
  update()
}

</script>

<template>
  <div ref="imageContainer"
    :class="cn('relative border w-full h-full flex justify-center items-center overflow-auto', props.class)"
    @wheel.prevent>
    <ContextMenu>
      <ContextMenuTrigger class="flex w-full h-full">
        <canvas ref="canvas" :class="{ 'cursor-none': landmarkDragged, 'cursor-pointer': !landmarkDragged }"
          @mousedown="startDrag" @mouseup="stopDrag" @mousemove="mousemove" @mouseout="stopDrag" @wheel="zoomWithWheel"
          @contextmenu="openContextMenu">
        </canvas>
      </ContextMenuTrigger>
      <ContextMenuContent class="w-64" @closeAutoFocus="closeContextMenu">
        <ContextMenuLabel>
          Place landmark
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem v-for="landmark in landmarksStore.landmarks" class="block" inset
          @select="clickContext(landmark as Landmark)">
          <div class="flex space-x-2 items-center">
            <svg class="h-4 w-4" viewBox="0 0 8 8" stroke="currentColor" stroke-width="1" :fill="landmark.getColorHEX()"
              xmlns="http://www.w3.org/2000/svg">
              <circle cx="4" cy="4" r="3" />
            </svg>
            <div class="flex item-centers">{{ landmark.getLabel() }}</div>
          </div>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem class="block" inset @select="addLandmark">
          Add Landmark
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem v-if="landmarkDragged != null" @select="deleteLandmark(landmarkDragged)">
          <div class="flex space-x-4 items-center">
            <span class="inline-block align-middle font-bold">Delete :</span>
            <div class="flex space-x-2 inline-block items-center">
              <svg class="h-4 w-4" viewBox="0 0 8 8" stroke="currentColor" stroke-width="1"
                :fill="landmarkDragged.getColorHEX()" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4" cy="4" r="3" />
              </svg>
              <span class="inline-flex items-center align-middle">{{ landmarkDragged.getLabel() }}</span>
            </div>
          </div>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    <img ref="base_image" class="hidden" :src="props.modelValue.image" alt="Image of view" aspect-ratio="auto"
      @load="loaded">
  </div>

</template>

<style scoped>
.object-fit {
  display: flex;
  object-fit: contain;
  max-width: none;
}
</style>

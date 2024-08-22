<script setup lang="ts">
import { LandmarkList } from "@/components/ui/landmark";
import { DistanceList } from "@/components/ui/distance";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from '@/components/ui/context-menu'

import { useVirtualCameraStore, useLandmarksStore, useVCImagesStore } from "@/lib/stores";
import { Landmark } from "@/data/models/landmark";
import { type Shortcut } from "@/data/models/shortcut";
import { Scale } from "@/lib/utils";

import { RepositoryFactory } from '@/data/repositories/repository_factory'
import { repositorySettings } from "@/config/appSettings"

const repository = RepositoryFactory.get(repositorySettings.type)

const imageStore = useVCImagesStore()
const landmarksStore = useLandmarksStore()

const camera = useVirtualCameraStore();
var mapShortcuts: Map<string, Shortcut> = new Map();

function getShortcuts() {
  repository.getShorcuts(imageStore.objectPath).then((shortcuts) => {
      shortcuts.forEach((item) => {
        mapShortcuts.set(item.name, item);
      });
    })
    .catch((error) => {
      console.error(error);
    });
}
const map: Map<string, string> = new Map();
map.set("top", "SUPERIOR");
map.set("bot", "INFERIOR");
map.set("left", "LEFT");
map.set("right", "RIGHT");
map.set("front", "FRONT");
map.set("back", "POST");

function shortcut(event: Event) {
  let target = event.currentTarget as HTMLButtonElement;
  if (
    target == null ||
    target.attributes.getNamedItem("data-key")?.value == undefined
  ) {
    return;
  }
  // TODO : It's ugly there's a triple Map !!
  let newPos: Shortcut | undefined = mapShortcuts.get(
    map.get(target.attributes.getNamedItem("data-key")?.value!)!
  );

  if (newPos != undefined) {
    camera.longitude = newPos.longitude;
    camera.latitude = newPos.latitude;
  }
}

function addDistance(){
  let id_left = landmarksStore.selectedGroup.deque[0]
  let id_right = landmarksStore.selectedGroup.deque[1]
  let left : Landmark = landmarksStore.landmarks.find((x) => x.id == id_left) as Landmark
  let right : Landmark = landmarksStore.landmarks.find((x) => x.id == id_right) as Landmark
  landmarksStore.addDistance(left, right)
}

function resetScale(){
  landmarksStore.adjustFactor = 1
}
getShortcuts();

console.log("Scale " + landmarksStore.scale)

</script>

<template>
  <div class="pb-[12px] w-auto">
    <div class="space-y-4 py-4">
      <div class="px-3 py-2">
        <h2 class="mb-2 px-4 text-lg font-semibold tracking-tight">
          Shortcuts
        </h2>
        <div class="grid grid-cols-4">
          <div class="grid grid-cols-subgrid col-span-4">
            <div class="col-start-2">
              <Button @click="shortcut" variant="secondary" class="w-full justify-center" data-key="top">
                TOP
              </Button>
            </div>
          </div>
          <Button @click="shortcut" variant="secondary" class="w-full justify-center" data-key="left">
            LEFT
          </Button>
          <Button @click="shortcut" variant="secondary" class="w-full justify-center" data-key="front">
            FRONT
          </Button>
          <Button @click="shortcut" variant="secondary" class="w-full justify-center" data-key="right">
            RIGHT
          </Button>
          <Button @click="shortcut" variant="secondary" class="w-full justify-center" data-key="back">
            BACK
          </Button>
          <div class="grid grid-cols-subgrid col-span-4">
            <div class="col-start-2">
              <Button @click="shortcut" variant="secondary" class="w-full justify-center" data-key="bot">
                BOT
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div class="px-3 py-2">
        <h2 class="relative px-7 text-lg font-semibold tracking-tight">
          Landmarks
        </h2>
          <ContextMenu>
            <ContextMenuTrigger class="flex w-full h-full">
              <LandmarkList/>
            </ContextMenuTrigger>
            <ContextMenuContent class="w-64">
              <ContextMenuItem class="block" inset @select="addDistance">
                Create Distance
              </ContextMenuItem>
          </ContextMenuContent>
          </ContextMenu>
      </div>
      <div class="px-3 py-2">
        <div class="flex row">
          <h2 class="relative px-7 text-lg font-semibold tracking-tight">
            Distances
          </h2>
          <div class="w-full h-full flex justify-end space-x-2">
            <Select v-model="landmarksStore.scale">
              <SelectTrigger class="w-16">
                <SelectValue placeholder="Pick a scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Scale</SelectLabel>
                  <SelectItem v-for="scale in Object.keys(Scale).filter((v) => isNaN(Number(v)))" :value="scale">
                    {{ scale }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="secondary" @click="resetScale">
              Reset Scale
            </Button>
          </div>
        </div>
        <DistanceList/>
      </div>
    </div>
  </div>
</template>

<style>
.scroll-align {
  scroll-snap-align: start;
  scroll-behavior: auto;
}

.scroll-snap-type {
  scroll-snap-type: y mandatory;
}
</style>

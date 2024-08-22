<script setup lang="ts">
import {useRoute} from 'vue-router'

import { ref } from "vue";
import Menu from "@/components/Menu.vue";
import Tabs from "@/components/Tabs.vue";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/ui/sidebar";
import { useSettingsStore, useVCImagesStore } from "@/lib/stores";

const settingsStore = useSettingsStore()
const route=useRoute();
const imageStore = useVCImagesStore()



console.log("Params : " + route.params)
imageStore.setPath(route.params.id as string)
</script>

<template>
  <main class="h-screen">
    <Menu class="sticky menu top-0 flex flex-row grow z-50"></Menu>
    <Separator></Separator>
    <div class="h-full flex"
    :class="settingsStore.isLeft ? 'flex-row' : 'flex-row-reverse'">
      <div class="rest_height overflow-auto sidebar rounded-md border p-4">
        <Sidebar />
      </div>

      <div class="rest_width rest_height flex grow items-center justify-center">
        <Tabs />
      </div>
    </div>
  </main>
</template>

<style scoped>
.menu {
  height: 60px;
}

.sidebar {
  width: 25%;
}

.rest_height {
  height: calc(100% - 61px);
}

.rest_width {
  width: 75%;
}
</style>

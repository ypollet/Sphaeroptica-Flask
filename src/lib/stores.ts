import * as math from 'mathjs'
import { defineStore, type PiniaPluginContext, type StateTree } from 'pinia'
import { degreesToRad } from '@/lib/utils'
import { DequeMax2, Distance, Landmark, LandmarkImage } from './types'
import type { VirtualCameraImage } from './types'
import Color from 'color'
import axios from 'axios'
import { objectPick } from '@vueuse/core'


export const DEFAULT_TAB = "viewer"

export const useLandmarkImagesStore = defineStore('landmarks_images', {
  state: () => ({ images: Array<LandmarkImage>(), selected: -1 }),
  getters: {
    getTabName: (state) => (state.selected >= 0 && state.selected < state.images.length) ? state.images[state.selected].name : DEFAULT_TAB,
  },
  actions: {
    reset() {
      this.images = []
      this.selected = -1
    },
    setTab(value: string) {
      this.selected = this.images.findIndex((image) => image.name == value)
    },
    removeImage(index: number) {
      this.images.splice(index, 1)
    },
    addImage(image: LandmarkImage) {
      if (this.images.filter((el) => el.name == image.name).length == 0) {
        this.images.push(image)
      }
    }
  },
  persist: {
    storage: sessionStorage,
    key: 'landmarks_images',
    afterRestore: (ctx: PiniaPluginContext) => {
      let images = ctx.store.$state.images.map((x: LandmarkImage) => x)
      console.log("Restore LandmarkImages")
      console.log(images)
      ctx.store.$state.images = images.map((jsonObject: LandmarkImage) =>
          new LandmarkImage(jsonObject.name, 
            jsonObject.image, 
            jsonObject.zoom, 
            jsonObject.offset, 
            new Map(Object.entries(jsonObject.versions)), 
            new Map(Object.entries(jsonObject.reprojections)))
      )
      console.log(ctx.store.$state.images)
    },
  },
})

export const useVCImagesStore = defineStore('vc_images', {
  state: () => ({
    latMin: Number.MAX_VALUE,
    latMax: Number.MIN_VALUE,
    images: Array<VirtualCameraImage>(),
    objectPath: "geonemus-geoffroyii",
    selectedImage: "https://cdn.uclouvain.be/groups/cms-editors-arec/charte-graphique-uclouvain/UCLouvain_Logo_Pos_CMJN.png?itok=0Vz8FOqj",
    selectedImageName: "UCLouvain"
  }),
  actions: {
    reset() {
      this.latMin = Number.MAX_VALUE
      this.latMax = Number.MIN_VALUE
      this.images = []
      this.objectPath = "geonemus-geoffroyii"
      this.selectedImage = "https://cdn.uclouvain.be/groups/cms-editors-arec/charte-graphique-uclouvain/UCLouvain_Logo_Pos_CMJN.png?itok=0Vz8FOqj"
      this.selectedImageName = "UCLouvain"
    },
    setNearestImage(radPos: number[]) {
      let bestAngle: Number = Infinity;
      let bestImage: VirtualCameraImage | null = null

      this.images.forEach((imageData: VirtualCameraImage) => {
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
      this.selectedImage = imageData.image
      this.selectedImageName = imageData.name
    }
  },
  persist: {
    storage: sessionStorage,
    key: 'vc_images',
  },
})
export const useVirtualCameraStore = defineStore('camera', {
  state: () => ({
    longitude: 0,
    latitude: 0,
  }),
  getters: {
    toRad: (state) => [degreesToRad(state.longitude), degreesToRad(state.latitude)],
  },
  actions: {
    reset() {
      this.longitude = 0
      this.latitude = 0
    },
    setLongitude(move: number, longMin: number, longMax: number) {
      let difference: number = longMax - longMin
      this.longitude -= longMin + move
      while (this.longitude < 0) {
        this.longitude += difference
      }
      this.longitude = ((this.longitude) % difference) + longMin
    },
    setLatitude(move: number, latMin: number, latMax: number) {
      this.latitude = math.min(math.max(this.latitude + move, latMin), latMax)
    },
  },

  persist: {
    storage: sessionStorage,
    key: 'camera',
  },
})

export const useLandmarksStore = defineStore('landmarks', {
  state: () => ({ landmarks: Array<Landmark>(),
                  selectedGroup : new DequeMax2(),
                  distances: Array<Distance>()
                }),
  actions: {
    addLandmark(landmark: Landmark) {
      this.landmarks.push(landmark)
    },
    generateID() {
      let check: boolean = false
      let id: string = ""
      while (!check) {
        id = (Math.random() + 1).toString(36).substring(2);
        if (this.landmarks.filter(e => e.getId() === id).length == 0) {
          check = true
        }
      }
      return id;
    },
    addDistance(left : Landmark, right : Landmark){
      let distance : Distance = new Distance("distance_"+this.distances.length, left, right)
      if(this.distances.filter((x) => x.equals(distance)).length == 0){
        this.distances.push(distance)
      }
    }
  },
  persist: {
    storage: sessionStorage,
    key: 'landmarks',
    afterRestore: (ctx: PiniaPluginContext) => {
      // restore landmarks
      let landmarks = ctx.store.$state.landmarks.map((x: Landmark) => x)
      let landmarksToKeep = landmarks.map((jsonObject: Landmark) =>
        new Landmark(jsonObject.id, jsonObject.label, jsonObject.version, Color(jsonObject.color), new Map(Object.entries(jsonObject.poses)), jsonObject.position)
      )
      ctx.store.$state.landmarks = landmarksToKeep

      // restore selectedGroup
      let selectedGroup = new DequeMax2()
      let deque = ctx.store.$state.selectedGroup
      if(deque){
        for(let i = 0; i < Object.values(deque.deque).length; i++){
          selectedGroup.add(deque.deque[i])
        }
        ctx.store.$state.selectedGroup = selectedGroup
      }

      // restore distances
      landmarksToKeep.forEach((x : Landmark) => {
        console.log(x.id)
      })
      let distances = ctx.store.$state.distances.map((x : Distance) => x)

      ctx.store.$state.distances = distances.map((jsonObject: Distance) => 
        new Distance(jsonObject.label, landmarksToKeep[landmarksToKeep.map((e : Landmark) => e.id).indexOf(jsonObject.landmarkLeft.id)], 
          landmarksToKeep[landmarksToKeep.map((e : Landmark) => e.id).indexOf(jsonObject.landmarkRight.id)])
      )
      
    },
  },
})
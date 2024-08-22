import { createRouter, createWebHistory } from 'vue-router'
import ViewerView from '../views/ViewerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:id',
      name: 'viewer',
      component: ViewerView
    }
  ]
})

export default router

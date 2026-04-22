import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Workspace',
    component: () => import('../views/Workspace.vue')
  },
  {
    path: '/projects',
    name: 'ProjectList',
    component: () => import('../views/ProjectList.vue')
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: () => import('../views/ProjectDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

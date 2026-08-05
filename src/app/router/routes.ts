import {RouteRecordRaw} from "vue-router";
import HomeView from "../views/home-view.vue";

export default [
    {
        name: 'home',
        path: '/',
        component: HomeView
    }
] as RouteRecordRaw[]
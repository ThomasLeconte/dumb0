import {RouteRecordRaw} from "vue-router";
import HomeView from "../views/home-view.vue";
import TablesView from "../views/tables-view.vue";

export default [
    {
        name: 'home',
        path: '/',
        component: HomeView
    },
    {
        name: 'tables',
        path: '/tables',
        component: TablesView
    }
] as RouteRecordRaw[]
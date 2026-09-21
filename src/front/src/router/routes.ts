import {RouteRecordRaw} from "vue-router";
import HomeView from "@/views/home-view.vue";
import TablesView from "@/views/datasource/tables-view.vue";
import Index from "@/views/datasource/index.vue";
import GeneralView from "@/views/datasource/general-view.vue";
import QueryView from "@/views/datasource/query-view.vue";

export default [
    {
        name: 'home',
        path: '/',
        component: HomeView
    },
    {
        name: 'datasource',
        path: '/datasource',
        component: Index,
        children: [
            {
                name: 'tables',
                path: '/tables',
                component: TablesView
            },
            {
                name: 'general',
                path: '/general',
                component: GeneralView
            },
            {
                name: 'query',
                path: '/query',
                component: QueryView
            }
        ]
    }
] as RouteRecordRaw[]
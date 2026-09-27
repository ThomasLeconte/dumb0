import { createRouter, createWebHistory} from "vue-router";
import routes from "./routes.ts";
import {usePostHog} from "@/composables/use-posthog.ts";

export default createRouter({
    history: createWebHistory(),
    routes
})

const {posthog} = usePostHog();
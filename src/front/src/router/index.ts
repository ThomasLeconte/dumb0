import {createMemoryHistory, createRouter} from "vue-router";
import routes from "./routes.ts";

export default createRouter({
    history: createMemoryHistory(),
    routes
})
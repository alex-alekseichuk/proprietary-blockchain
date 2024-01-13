import Vue from "vue";
import VueRouter from "vue-router";
import TemplateExplorer from "../views/TemplateExplorer.vue";
import Template from "../views/Template.vue";
import InstanceExplorer from "../views/InstanceExplorer.vue";
import Instance from "../views/Instance.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "TemplateExplorer",
    component: TemplateExplorer,
  },
  {
    path: "/template/:id",
    name: "TemplateEditor",
    component: Template,
    props: true,
  },
  {
    path: "/template/:id/instances",
    name: "TemplateInstances",
    component: InstanceExplorer,
  },
  {
    path: "/instances/",
    name: "InstanceExplorer",
    component: InstanceExplorer,
  },
  {
    path: "/instance/:id",
    name: "Instance",
    component: Instance,
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
];

const router = new VueRouter({
  routes,
});

export default router;

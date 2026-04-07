import { Layout } from "@/components/layout/Layout";
import { Outlet, createRootRoute } from "@tanstack/react-router";

function RootComponent() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});

import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "./actions";

export default async function CategoriesPage() {
  const membership = await getCurrentTenantMembership();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", membership.tenant_id)
    .order("name");

  return (
    <main style={{ padding: 20 }}>
      <h1>Budget Categories</h1>

      <h2>Create Category</h2>

      <form action={createCategoryAction}>
        <input name="name" placeholder="Category name" required />

        <select name="tag">
          <option value="standard">Standard</option>
          <option value="savings">Savings</option>
          <option value="investment">Investment</option>
        </select>

        <button type="submit">Create</button>
      </form>

      <h2>Existing Categories</h2>

      {categories?.map((cat) => (
        <div key={cat.id} style={{ marginTop: 20 }}>
          <form action={updateCategoryAction}>
            <input type="hidden" name="id" value={cat.id} />

            <input name="name" defaultValue={cat.name} />

            <select name="tag" defaultValue={cat.tag}>
              <option value="standard">Standard</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>

            <button>Save</button>
          </form>

          <form action={deleteCategoryAction}>
            <input type="hidden" name="id" value={cat.id} />

            <button>Delete</button>
          </form>
        </div>
      ))}
    </main>
  );
}
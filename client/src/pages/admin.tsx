import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Product, type ProductOption, type PriceRule, type User, UserRole } from "@shared/prisma-schema";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ALL_VENDOR_PERMISSIONS = [
  "order:update_status",
  "product:view",
  "product:edit",
  "order:view",
  "notification:view",
];

const ALL_ORDER_STATUSES = ["pending", "received", "in production", "shipped", "delivered", "cancelled"];

const ALL_USER_ROLES = ["CUSTOMER", "VENDOR", "ADMIN"];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { userId, role } = useAuth();
  const queryClient = useQueryClient();
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [assignProductId, setAssignProductId] = useState<string>("");
  const [assignVendorId, setAssignVendorId] = useState<string>("");
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedVendorForPermissions, setSelectedVendorForPermissions] = useState<any | null>(null);
  const [vendorPermissions, setVendorPermissions] = useState<string[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderVendorFilter, setOrderVendorFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Fixed items per page for now

  const [selectedProductForOptions, setSelectedProductForOptions] = useState<string | null>(null);
  const [availableOptionTypesForProduct, setAvailableOptionTypesForProduct] = useState<string[]>([]);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState<ProductOption | null>(null);

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    isActive: true,
  });

  const ALL_PRODUCT_OPTION_TYPES = ["quantity", "paper", "finish", "size"]; // Define all possible option types

  const vendorsQuery = useQuery({
    queryKey: ["/api/admin/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
    enabled: role === "ADMIN",
  });

  const toggleVendorActiveMutation = useMutation({
    mutationFn: async ({ vendorId, isActive }: { vendorId: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/vendors/${vendorId}/toggle`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include', 
        body: JSON.stringify({ isActive }) 
      });
      if (!res.ok) throw new Error("Failed to toggle vendor active status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({ title: "Vendor status updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update vendor status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateVendorPermissionsMutation = useMutation({
    mutationFn: async ({ vendorId, permissions }: { vendorId: string; permissions: string[] }) => {
      const res = await fetch(`/api/admin/vendors/${vendorId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) throw new Error("Failed to update vendor permissions");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({ title: "Vendor permissions updated" });
      setPermissionDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update vendor permissions",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignVendorToProductMutation = useMutation({
    mutationFn: async ({ productId, vendorId }: { productId: string; vendorId: string }) => {
      const res = await fetch(`/api/admin/products/${productId}/vendor`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include', 
        body: JSON.stringify({ vendorId }) 
      });
      if (!res.ok) throw new Error("Failed to assign vendor to product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Vendor assigned to product" });
      setAssignProductId("");
      setAssignVendorId("");
    },
    onError: (error) => {
      toast({
        title: "Failed to assign vendor to product",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const ordersQuery = useQuery({
    queryKey: ["/api/admin/orders", orderStatusFilter, orderVendorFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (orderStatusFilter !== "all") {
        params.append("status", orderStatusFilter);
      }
      if (orderVendorFilter !== "all") {
        params.append("vendorId", orderVendorFilter);
      }
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: role === "ADMIN",
  });

  const productsQuery = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: role === "ADMIN",
  });

  const productOptionsQuery = useQuery<ProductOption[]>({
    queryKey: ["/api/products", selectedProductForOptions, "options"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${selectedProductForOptions}/options`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch product options");
      return res.json();
    },
    enabled: !!selectedProductForOptions && role === "ADMIN",
  });

  const usersQuery = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: role === "ADMIN",
  });

  const updateProductAvailableOptionTypesMutation = useMutation({
    mutationFn: async ({ productId, availableOptionTypes }: { productId: string; availableOptionTypes: string[] }) => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ availableOptionTypes }),
      });
      if (!res.ok) throw new Error("Failed to update product available option types");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProductForOptions] });
      toast({ title: "Product available option types updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update product available option types",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createProductOptionMutation = useMutation({
    mutationFn: async (optionData: Partial<ProductOption> & { productId: string }) => {
      const res = await fetch(`/api/admin/products/${optionData.productId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(optionData),
      });
      if (!res.ok) throw new Error("Failed to create product option");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProductForOptions, "options"] });
      toast({ title: "Product option created" });
      setIsOptionDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create product option",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProductOptionMutation = useMutation({
    mutationFn: async (optionData: Partial<ProductOption>) => {
      if (!optionData.id) throw new Error("Option ID is required for update");
      const res = await fetch(`/api/admin/product-options/${optionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(optionData),
      });
      if (!res.ok) throw new Error("Failed to update product option");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProductForOptions, "options"] });
      toast({ title: "Product option updated" });
      setIsOptionDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update product option",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteProductOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const res = await fetch(`/api/admin/product-options/${optionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete product option");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProductForOptions, "options"] });
      toast({ title: "Product option deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete product option",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const res = await fetch("/api/admin/users", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
      setIsUserDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      if (!userData.id) throw new Error("User ID is required for update");
      const res = await fetch(`/api/admin/users/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
      setIsUserDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedProductForOptions) {
      const product = productsQuery.data?.find((p: Product) => p.id === selectedProductForOptions);
      if (product) {
        setAvailableOptionTypesForProduct((product.availableOptionTypes || []) as string[]);
      }
    }
  }, [selectedProductForOptions, productsQuery.data]);

  const handleAvailableOptionTypeChange = (type: string, checked: boolean) => {
    setAvailableOptionTypesForProduct(prev => {
      const newState = checked ? [...prev, type] : prev.filter(t => t !== type);
      if (selectedProductForOptions) {
        updateProductAvailableOptionTypesMutation.mutate({
          productId: selectedProductForOptions,
          availableOptionTypes: newState,
        });
      }
      return newState;
    });
  };

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated" });
      if (orderDetail) {
        setOrderDetail({ ...orderDetail, status });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update order status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const totalRevenue = (ordersQuery.data?.orders || []).reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
  const ordersThisMonth = (ordersQuery.data?.orders || []).filter((o: any) => new Date(o.createdAt).getMonth() === new Date().getMonth()).length;

  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardTitle>Access Denied</CardTitle>
          <CardContent className="mt-4">You do not have administrative privileges to view this page.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Orders This Month</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{ordersThisMonth}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Vendors</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{vendorsQuery.data?.length || 0}</CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Vendors</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Active</th><th className="pb-2">Actions</th></tr>
                  </thead>
                  <tbody>
                    {Array.isArray(vendorsQuery.data) && vendorsQuery.data.map((v: any) => (
                      <tr key={v.id} className="border-t">
                        <td className="py-3">{v.firstName} {v.lastName}</td>
                        <td className="py-3">{v.email}</td>
                        <td className="py-3"><Badge>VENDOR</Badge></td>
                        <td className="py-3">{v.isActive ? <Badge variant="outline">Yes</Badge> : <Badge variant="destructive">No</Badge>}</td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => toggleVendorActiveMutation.mutate({ vendorId: v.id, isActive: !v.isActive })}
                              disabled={toggleVendorActiveMutation.isPending}
                            >
                              {v.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={() => {
                                setSelectedVendorForPermissions(v);
                                setVendorPermissions(v.permissions || []);
                                setPermissionDialogOpen(true);
                              }}
                            >
                              Manage Permissions
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {vendorsQuery.data?.length === 0 && (<tr><td className="py-6 text-gray-500" colSpan={5}>No vendors</td></tr>)}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Recent Orders</CardTitle>
              <div className="flex space-x-2">
                <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ORDER_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={orderVendorFilter} onValueChange={setOrderVendorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {Array.isArray(vendorsQuery.data) && vendorsQuery.data.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.firstName} {v.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600"><th className="pb-2">Order #</th><th className="pb-2">Total</th><th className="pb-2">Status</th><th className="pb-2">Actions</th></tr>
                  </thead>
                  <tbody>
                    {ordersQuery.data?.orders?.map((o: any) => (
                      <tr key={o.id} className="border-t">
                        <td className="py-3">{o.orderNumber}</td>
                        <td className="py-3">฿{parseFloat(o.totalAmount).toLocaleString()}</td>
                        <td className="py-3"><Badge>{o.status}</Badge></td>
                        <td className="py-3">
                          <Button size="sm" variant="outline" onClick={async () => {
                            const res = await fetch(`/api/orders/${o.id}`, { credentials: 'include' });
                            const detail = await res.json();
                            setOrderDetail(detail);
                            setOrderOpen(true);
                          }}>View</Button>
                        </td>
                      </tr>
                    ))}
                    {ordersQuery.data?.orders?.length === 0 && (<tr><td className="py-6 text-gray-500" colSpan={3}>No orders</td></tr>)}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls */}
              <div className="flex justify-between items-center mt-4">
                <Button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || ordersQuery.isFetching}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {Math.ceil((ordersQuery.data?.total || 0) / itemsPerPage)}
                </span>
                <Button 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * itemsPerPage >= (ordersQuery.data?.total || 0) || ordersQuery.isFetching}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Assignment Panel */}
        <Card>
          <CardHeader><CardTitle>Assign Vendor to Product</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Product</label>
              <Select value={assignProductId} onValueChange={setAssignProductId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {Array.isArray(productsQuery.data) && productsQuery.data.map((p: Product) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameEn} {p.vendorId && `(Assigned to: ${Array.isArray(vendorsQuery.data) ? vendorsQuery.data.find((v: any) => v.id === p.vendorId)?.firstName || 'N/A' : 'N/A'})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Vendor</label>
              <Select value={assignVendorId} onValueChange={setAssignVendorId}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {Array.isArray(vendorsQuery.data) && vendorsQuery.data.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.firstName} {v.lastName} ({v.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full" 
                disabled={!assignProductId || !assignVendorId || assignVendorToProductMutation.isPending}
                onClick={() => assignVendorToProductMutation.mutate({ productId: assignProductId, vendorId: assignVendorId })}
              >
                {assignVendorToProductMutation.isPending ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">User Management</CardTitle>
            <Button size="sm" onClick={() => {
              setCurrentUser(null);
              setNewUserData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'CUSTOMER',
                isActive: true,
              });
              setIsUserDialogOpen(true);
            }}>Add New User</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Active</th><th className="pb-2">Actions</th></tr>
                </thead>
                <tbody>
                  {Array.isArray(usersQuery.data) && usersQuery.data.map((u: User) => (
                    <tr key={u.id} className="border-t">
                      <td className="py-3">{u.firstName} {u.lastName}</td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3"><Badge>{u.role}</Badge></td>
                      <td className="py-3">{u.isActive ? <Badge variant="outline">Yes</Badge> : <Badge variant="destructive">No</Badge>}</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => { setCurrentUser(u); setIsUserDialogOpen(true); }}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => toggleVendorActiveMutation.mutate({ vendorId: u.id, isActive: !u.isActive })} // Reusing for any user for now
                            disabled={toggleVendorActiveMutation.isPending}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersQuery.data?.length === 0 && (<tr><td className="py-6 text-gray-500" colSpan={5}>No users</td></tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Product Options Management */}
        <Card>
          <CardHeader><CardTitle>Product Options Management</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Select Product</Label>
              <Select value={selectedProductForOptions || ""} onValueChange={setSelectedProductForOptions}>
                <SelectTrigger><SelectValue placeholder="Select a product to manage options" /></SelectTrigger>
                <SelectContent>
                  {Array.isArray(productsQuery.data) && productsQuery.data.map((p: Product) => (
                    <SelectItem key={p.id} value={p.id}>{p.nameEn} ({p.nameTh})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductForOptions && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">Available Option Types for Product</Label>
                  <div className="flex flex-wrap gap-4">
                    {ALL_PRODUCT_OPTION_TYPES.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`option-type-${type}`}
                          checked={availableOptionTypesForProduct.includes(type)}
                          onCheckedChange={(checked) => handleAvailableOptionTypeChange(type, checked as boolean)}
                        />
                        <Label htmlFor={`option-type-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Options for {productsQuery.data?.find((p: Product) => p.id === selectedProductForOptions)?.nameEn}</h3>
                  <Button size="sm" onClick={() => { setCurrentOption(null); setIsOptionDialogOpen(true); }}>Add New Option</Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Name (EN)</th>
                        <th className="pb-2">Name (TH)</th>
                        <th className="pb-2">Price Modifier</th>
                        <th className="pb-2">Price Rules</th>
                        <th className="pb-2">Default</th>
                        <th className="pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(productOptionsQuery.data) && productOptionsQuery.data.map((option: ProductOption) => (
                        <tr key={option.id} className="border-t">
                          <td className="py-3">{option.type}</td>
                          <td className="py-3">{option.nameEn}</td>
                          <td className="py-3">{option.nameTh}</td>
                          <td className="py-3">{parseFloat(option.defaultPriceModifier.toString()).toLocaleString()}</td>
                          <td className="py-3 text-xs">{JSON.stringify(option.priceRules)}</td>
                          <td className="py-3">{option.isDefault ? <Badge variant="outline">Yes</Badge> : "No"}</td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => { setCurrentOption(option); setIsOptionDialogOpen(true); }}>Edit</Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteProductOptionMutation.mutate(option.id || '')}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {productOptionsQuery.data?.length === 0 && (<tr><td colSpan={7} className="py-6 text-center text-gray-500">No options configured for this product.</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Product Option Add/Edit Dialog */}
        <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentOption ? "Edit Product Option" : "Add New Product Option"}</DialogTitle>
            </DialogHeader>
            {/* Form for adding/editing options will go here */}
            <form onSubmit={e => e.preventDefault()} className="space-y-4">
              <div>
                <Label htmlFor="option-type">Option Type</Label>
                <Select 
                  value={currentOption?.type || ALL_PRODUCT_OPTION_TYPES[0]}
                  onValueChange={(value) => setCurrentOption(prev => prev ? { ...prev, type: value } : { id: '', productId: selectedProductForOptions || '', type: value, nameEn: '', nameTh: '', defaultPriceModifier: 0 as any, priceRules: {} as any, isDefault: false, createdAt: new Date(), updatedAt: new Date() })}
                  disabled={!!currentOption} // Disable type change for existing options
                >
                  <SelectTrigger id="option-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {ALL_PRODUCT_OPTION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="option-name-en">Name (English)</Label>
                <Input 
                  id="option-name-en" 
                  value={currentOption?.nameEn || ''} 
                  onChange={e => setCurrentOption(prev => prev ? { ...prev, nameEn: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="option-name-th">Name (Thai)</Label>
                <Input 
                  id="option-name-th" 
                  value={currentOption?.nameTh || ''} 
                  onChange={e => setCurrentOption(prev => prev ? { ...prev, nameTh: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="option-price-modifier">Default Price Modifier</Label>
                <Input 
                  id="option-price-modifier" 
                  type="number" 
                  step="0.01" 
                  value={parseFloat(currentOption?.defaultPriceModifier?.toString() || '0')} 
                  onChange={e => setCurrentOption(prev => prev ? { ...prev, defaultPriceModifier: parseFloat(e.target.value) as any } : null)}
                />
              </div>
              <div>
                <Label htmlFor="option-price-rules">Price Rules (JSON)</Label>
                <Textarea 
                  id="option-price-rules" 
                  value={JSON.stringify(currentOption?.priceRules || {}, null, 2)} 
                  onChange={e => {
                    try {
                      setCurrentOption(prev => prev ? { ...prev, priceRules: JSON.parse(e.target.value) } : null);
                    } catch (err) {
                      console.error("Invalid JSON for price rules", err);
                      toast({ title: "Invalid JSON for price rules", variant: "destructive" });
                    }
                  }}
                  rows={5}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="option-is-default"
                  checked={currentOption?.isDefault || false}
                  onCheckedChange={(checked) => setCurrentOption(prev => prev ? { ...prev, isDefault: checked } : null)}
                />
                <Label htmlFor="option-is-default">Is Default Option</Label>
              </div>
              <Button
                type="submit"
                className="w-full"
                onClick={() => {
                  if (currentOption && selectedProductForOptions) {
                    if (currentOption.id) {
                      updateProductOptionMutation.mutate(currentOption);
                    } else {
                      createProductOptionMutation.mutate({ ...currentOption, productId: selectedProductForOptions } as ProductOption & { productId: string });
                    }
                  }
                }}
                disabled={createProductOptionMutation.isPending || updateProductOptionMutation.isPending || !currentOption?.nameEn || !currentOption?.nameTh}
              >
                {currentOption?.id ? (updateProductOptionMutation.isPending ? "Saving..." : "Save Changes") : (createProductOptionMutation.isPending ? "Adding..." : "Add Option")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      </div>
      <Footer />

      {/* Order Details Modal */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
          {orderDetail ? (
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Order #:</span> {orderDetail.orderNumber}</div>
              <div><span className="text-gray-500">Status:</span> <Badge>{orderDetail.status}</Badge></div>
              <div><span className="text-gray-500">Total:</span> ฿{parseFloat(orderDetail.totalAmount).toLocaleString()}</div>
              <div className="pt-2 font-medium">Items</div>
              <ul className="list-disc pl-5">
                {orderDetail.items?.map((it: any) => (
                  <li key={it.id}>{productsQuery.data?.find((p: any) => p.id === it.productId)?.nameEn || "Unknown Product"} × {it.quantity} — ฿{parseFloat(it.totalPrice).toLocaleString()}</li>
                ))}
              </ul>
              <div className="pt-4 flex flex-wrap gap-2">
                {ALL_ORDER_STATUSES.map(status => (
                  <Button 
                    key={status} 
                    variant={orderDetail.status === status ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => updateOrderStatusMutation.mutate({ orderId: orderDetail.id, status })}
                    disabled={updateOrderStatusMutation.isPending || orderDetail.status === status}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Permissions for {selectedVendorForPermissions?.firstName} {selectedVendorForPermissions?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {ALL_VENDOR_PERMISSIONS.map(permission => (
              <div key={permission} className="flex items-center space-x-2">
                <Switch
                  id={`perm-${permission}`}
                  checked={vendorPermissions.includes(permission)}
                  onCheckedChange={(checked) => {
                    setVendorPermissions(prev =>
                      checked
                        ? [...prev, permission]
                        : prev.filter(p => p !== permission)
                    );
                  }}
                />
                <Label htmlFor={`perm-${permission}`}>{permission}</Label>
              </div>
            ))}
          </div>
          <Button 
            className="w-full"
            onClick={() => {
              if (selectedVendorForPermissions) {
                updateVendorPermissionsMutation.mutate({
                  vendorId: selectedVendorForPermissions.id,
                  permissions: vendorPermissions,
                });
              }
            }}
            disabled={updateVendorPermissionsMutation.isPending}
          >
            {updateVendorPermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* User Add/Edit Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => e.preventDefault()} className="space-y-4">
            <div>
              <Label htmlFor="user-first-name">First Name</Label>
              <Input
                id="user-first-name"
                value={currentUser ? currentUser.firstName : newUserData.firstName}
                onChange={e => currentUser ?
                  setCurrentUser(prev => prev ? { ...prev, firstName: e.target.value } : null) :
                  setNewUserData(prev => ({ ...prev, firstName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="user-last-name">Last Name</Label>
              <Input
                id="user-last-name"
                value={currentUser ? currentUser.lastName : newUserData.lastName}
                onChange={e => currentUser ?
                  setCurrentUser(prev => prev ? { ...prev, lastName: e.target.value } : null) :
                  setNewUserData(prev => ({ ...prev, lastName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={currentUser ? currentUser.email : newUserData.email}
                onChange={e => currentUser ?
                  setCurrentUser(prev => prev ? { ...prev, email: e.target.value } : null) :
                  setNewUserData(prev => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={currentUser ? (currentUser as any).password || '' : newUserData.password}
                onChange={e => currentUser ?
                  setCurrentUser(prev => prev ? { ...prev, password: e.target.value } : null) :
                  setNewUserData(prev => ({ ...prev, password: e.target.value }))
                }
                placeholder={currentUser ? "Leave blank to keep current password" : "Required for new user"}
              />
            </div>
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={currentUser ? currentUser.role : newUserData.role}
                onValueChange={(value) => currentUser ?
                  setCurrentUser(prev => prev ? { ...prev, role: value as typeof prev.role } : null) :
                  setNewUserData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger id="user-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ALL_USER_ROLES.map(role => (
                    <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="user-is-active"
                checked={currentUser ? currentUser.isActive : newUserData.isActive}
                onCheckedChange={(checked) => currentUser ?
                  setCurrentUser(prev => prev ? { ...prev, isActive: checked } : null) :
                  setNewUserData(prev => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="user-is-active">Is Active</Label>
            </div>
            <Button
              type="submit"
              className="w-full"
              onClick={() => {
                if (currentUser) {
                  // Only send password if it's explicitly set for update
                  const { password, ...userUpdates } = currentUser;
                  const updates = password ? { ...userUpdates, password } : userUpdates;
                  updateUserMutation.mutate(updates);
                } else {
                  // Creating new user
                  if (!newUserData.password) {
                    alert("Password is required for new users");
                    return;
                  }
                  createUserMutation.mutate({
                    firstName: newUserData.firstName,
                    lastName: newUserData.lastName,
                    email: newUserData.email,
                    password: newUserData.password,
                    role: newUserData.role as UserRole,
                    isActive: newUserData.isActive,
                  });
                }
              }}
              disabled={
                updateUserMutation.isPending ||
                createUserMutation.isPending ||
                !((currentUser && currentUser.firstName && currentUser.lastName && currentUser.email) ||
                  (!currentUser && newUserData.firstName && newUserData.lastName && newUserData.email && newUserData.password))
              }
            >
              
              {currentUser ? (updateUserMutation.isPending ? "Saving..." : "Save Changes") : (createUserMutation.isPending ? "Adding..." : "Add User")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



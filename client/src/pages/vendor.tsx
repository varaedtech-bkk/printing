import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order, OrderItem, OrderWithItems } from "@shared/prisma-schema";

const ORDER_STATUSES = ["all", "pending", "received", "in production", "shipped", "delivered", "cancelled"];

export default function VendorDashboard() {
  const { userId, role } = useAuth();
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Fixed items per page for now

  const ordersQuery = useQuery({
    queryKey: ["/api/vendor/orders", userId, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("vendorId", userId as string);
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());

      const res = await fetch(`/api/vendor/orders?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendor orders");
      return res.json();
    },
    enabled: !!userId && role === "VENDOR"
  });

  const notificationsQuery = useQuery({
    queryKey: ["/api/notifications", userId],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?userId=${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!userId
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => ordersQuery.refetch()
  });

  // Fetch product details for all unique products in the vendor's orders
  const productIdsInOrders = ordersQuery.data?.orders
    ? [...new Set((ordersQuery.data.orders as OrderWithItems[]).flatMap((order: OrderWithItems) => order.items?.map((item: OrderItem) => item.productId ?? '')).filter(Boolean))]
    : [];

  const productsQuery = useQuery({
    queryKey: ["vendorProducts", productIdsInOrders.join(",")],
    queryFn: async () => {
      const productsMap: { [key: string]: any } = {};
      if (productIdsInOrders.length === 0) return productsMap;
      
      // Fetch each product individually for simplicity, could be optimized with a bulk API if available
      for (const productId of productIdsInOrders) {
        const res = await fetch(`/api/products/${productId ?? ''}`, { credentials: "include" });
        if (res.ok) {
          productsMap[productId as string] = await res.json();
        } else {
          console.error(`Failed to fetch product ${productId}`);
        }
      }
      return productsMap;
    },
    enabled: ordersQuery.isSuccess && productIdsInOrders.length > 0,
  });

  // SSE + audio on new orders
  const audioRef = useRef<HTMLAudioElement | null>(null);
  function playTone() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, ctx.currentTime);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.55);
        return;
      }
    } catch {}
    // Fallback small data-uri click
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/mp3;base64,//uQxAAADhYGF2c2QAAQAAAACAAACbG1hNAABAAAAAQAAAG5pc2YAAQAAAAEAAABpc28yAAACAAACAAACcG1hMwAAAAABAAACAAAATGF2YzU4LjI2AAAAAAADAAACcQABAAAAAAEA//uQxAABAAAAAQAACgAAAABkYXRhAAAAAA==');
    }
    audioRef.current!.currentTime = 0;
    audioRef.current!.play().catch(() => {});
  }
  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(`/api/events?userId=${userId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === 'new-order') {
          toast.success(`New order ${data.orderNumber}`);
          playTone();
          ordersQuery.refetch();
          notificationsQuery.refetch();
        }
      } catch {}
    };
    return () => es.close();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notificationsQuery.data?.slice(0, 5).map((n: any) => (
                <div key={n.id} className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-sm text-gray-600">{n.body}</div>
                  </div>
                  {!n.isRead && <Badge variant="outline">New</Badge>}
                </div>
              ))}
              {notificationsQuery.data?.length === 0 && (
                <div className="text-sm text-gray-500">No notifications</div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Recent Orders</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="pb-2">Order #</th>
                      <th className="pb-2">Items</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersQuery.data?.orders?.map((o: OrderWithItems) => (
                      <tr key={o.id} className="border-t">
                        <td className="py-3 font-medium">{o.orderNumber}</td>
                        <td className="py-3">
                          <ul className="list-disc pl-4">
                            {o.items?.map((item: OrderItem) => (
                              <li key={item.id} className="text-gray-700">
                                {productsQuery.data?.[item.productId ?? '']?.nameEn || "Product"} x {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-3">฿{parseFloat(o.totalAmount).toLocaleString()}</td>
                        <td className="py-3">
                          <Badge>{o.status}</Badge>
                        </td>
                        <td className="py-3 space-x-2">
                          {["Received", "In Production", "Shipped", "Delivered"].map(s => (
                            <Button key={s} variant="outline" size="sm" 
                              onClick={() => updateStatus.mutate({ orderId: o.id, status: s })}
                              disabled={updateStatus.isPending}
                            >
                              {s}
                            </Button>
                          ))}
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                              setSelectedOrder(o);
                              setOrderDetailOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {ordersQuery.data?.orders?.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-gray-500">No orders yet</td></tr>
                    )}
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
      </div>
      <Footer />

      {/* Order Details Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order Details - {selectedOrder?.orderNumber || ''}</DialogTitle></DialogHeader>
          {selectedOrder ? (
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Order #:</span> {selectedOrder.orderNumber}</div>
              <div><span className="text-gray-500">Status:</span> <Badge>{selectedOrder.status}</Badge></div>
              <div><span className="text-gray-500">Total:</span> ฿{parseFloat(selectedOrder.totalAmount).toLocaleString()}</div>
              <div><span className="text-gray-500">Shipping Address:</span> {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.province} {selectedOrder.shippingAddress?.postalCode}</div>
              
              <div className="pt-2 font-medium">Items:</div>
              <ul className="list-disc pl-5 space-y-1">
                {selectedOrder?.items?.map((item: OrderItem) => (
                  <li key={item.id}>
                    {productsQuery.data?.[item.productId ?? '']?.nameEn || "Product"} x {item.quantity} — ฿{parseFloat(item.totalPrice).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}



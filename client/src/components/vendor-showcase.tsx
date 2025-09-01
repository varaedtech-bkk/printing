import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/prisma-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  Store,
  Star,
  MapPin,
  Phone,
  ExternalLink,
  ShoppingBag
} from "lucide-react";

export default function VendorShowcase() {
  const { t } = useI18n();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["/api/admin/vendors"],
    queryFn: () => apiRequest("GET", "/api/admin/vendors"),
    enabled: true, // Allow public access for vendor showcase
  });

  const vendorShops = [

    {
      name: "Bangkok Prints",
      slug: "bkkprints",
      description: "Large format printing and outdoor banners",
      rating: 4.6,
      reviews: 89,
      specialties: ["Banners", "Posters", "Vinyl Prints"],
      location: "Bangkok, Thailand",
      phone: "+66-2-987-6543"
    },
    {
      name: "Creative Print Co",
      slug: "creativeprint",
      description: "Creative designs and custom printing solutions",
      rating: 4.9,
      reviews: 156,
      specialties: ["Custom Designs", "Brochures", "Stickers"],
      location: "Bangkok, Thailand",
      phone: "+66-2-555-0123"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Store className="w-4 h-4 mr-2" />
            Featured Vendors
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Print Partner
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover professional print shops in Bangkok offering high-quality printing services
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {vendorShops.map((shop, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{shop.name}</CardTitle>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center mr-2">
                        {renderStars(shop.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {shop.rating} ({shop.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    Bangkok
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-3">{shop.description}</p>
              </CardHeader>

              <CardContent>
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Specialties:</h4>
                  <div className="flex flex-wrap gap-1">
                    {shop.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {shop.phone}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => window.open(`/printing/${shop.slug}`, '_blank')}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Visit Shop
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want to Become a Vendor?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join our platform and reach more customers with your printing services.
              Get your own shop page and start receiving orders online.
            </p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Become a Vendor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageSquare,
  Headphones,
  Users
} from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const contactMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent! 📧",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary-700">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">info@varaedtech.com | siamtechmedia@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">+66 94 887 7955</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600">
                        SRC printing Samut Prakan<br />
                        Bangkok 10110, Thailand
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-gray-600">
                        Mon - Fri: 8:00 AM - 6:00 PM<br />
                        Sat: 9:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-primary-50 to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Headphones className="w-6 h-6 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold text-primary-800">24/7 Support</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Need immediate help? Our customer support team is available around the clock.
                  </p>
                  <Button variant="outline" className="w-full" data-testid="live-chat">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Live Chat
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary-700">
                    <Send className="w-5 h-5 mr-2" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Your full name"
                          required
                          data-testid="contact-name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="your@email.com"
                          required
                          data-testid="contact-email"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder="What can we help you with?"
                        required
                        data-testid="contact-subject"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        required
                        data-testid="contact-message"
                        className="mt-1"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700"
                      disabled={contactMutation.isPending}
                      data-testid="contact-submit"
                    >
                      {contactMutation.isPending ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
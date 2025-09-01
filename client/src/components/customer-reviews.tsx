import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function CustomerReviews() {
  const { t } = useI18n();
  const reviews = [
    {
      id: 1,
      rating: 5,
      comment: "ใช้ AI ออกแบบนามบัตรได้ง่ายมาก แค่พิมพ์ข้อความก็ได้ดีไซน์สวยๆ แล้ว คุณภาพการพิมพ์ก็ดีเยี่ยม จะใช้บริการต่อแน่นอน",
      customerName: "นางสาว สมจิตร ใจดี",
      customerTitle: "เจ้าของร้านกาแฟ",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b0e0?w=100&h=100&fit=crop&crop=face",
      testId: "review-1"
    },
    {
      id: 2,
      rating: 5,
      comment: "ฟีเจอร์ตัดพื้นหลังอัตโนมัติสุดยอดมาก ประหยัดเวลาได้เยอะ ไม่ต้องใช้ Photoshop แล้ว ราคาก็เหมาะสมด้วย",
      customerName: "นาย ธนากร รุ่งเรือง",
      customerTitle: "นักการตลาด",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      testId: "review-2"
    },
    {
      id: 3,
      rating: 5,
      comment: "สั่งแบนเนอร์งานเปิดร้าน ได้รับภายใน 2 วัน คุณภาพเยี่ยม สีสันสดใส ทีมงานดูแลดีมาก แนะนำเลย!",
      customerName: "นางสาว วิไล ประสงค์ดี",
      customerTitle: "เจ้าของร้านขายของ",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      testId: "review-3"
    }
  ];

  const stats = [
    { value: "10,000+", label: t('reviews.stats.customers'), testId: "stat-customers" },
    { value: "50,000+", label: t('reviews.stats.orders'), testId: "stat-orders" },
    { value: "24 ชม.", label: t('reviews.stats.delivery'), testId: "stat-delivery" },
    { value: "99.8%", label: t('reviews.stats.satisfaction'), testId: "stat-satisfaction" }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4" data-testid="customer-reviews-badge">
            <Quote className="w-4 h-4 mr-2" />
            Customer Reviews
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('reviews.heading')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('reviews.subheading')}
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {reviews.map((review) => (
            <Card 
              key={review.id}
              className="border border-gray-200 hover:shadow-lg transition-all duration-300 group"
              data-testid={review.testId}
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex space-x-1 mr-2">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {review.rating}.0
                  </span>
                </div>

                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary opacity-20" />
                </div>

                {/* Review Text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {review.comment}
                </p>

                {/* Customer Info */}
                <div className="flex items-center">
                  <img
                    src={review.avatar}
                    alt={`${review.customerName} avatar`}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                    data-testid={`${review.testId}-avatar`}
                  />
                  <div>
                    <p className="font-semibold text-gray-900" data-testid={`${review.testId}-name`}>
                      {review.customerName}
                    </p>
                    <p className="text-sm text-gray-600" data-testid={`${review.testId}-title`}>
                      {review.customerTitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-16">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                Trusted by Thai Businesses
              </h3>
            </div>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              From small startups to large corporations, businesses across Thailand trust PrintEasy for their printing needs
            </p>
            
            {/* Company Logos */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center opacity-60">
              {Array.from({ length: 6 }, (_, index) => (
                <div 
                  key={index} 
                  className="bg-gray-200 rounded-lg p-4 h-16 flex items-center justify-center"
                  data-testid={`company-logo-${index + 1}`}
                >
                  <span className="text-gray-400 text-sm font-medium">Logo {index + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} data-testid={stat.testId}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Social Proof */}
        <div className="mt-16 text-center">
          <Card className="bg-green-50 border-green-200 inline-block">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex -space-x-2">
                  {reviews.map((review, index) => (
                    <img
                      key={index}
                      src={review.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Join 10,000+ happy customers</p>
                  <p className="text-sm text-gray-600">Average rating: 4.9/5 stars</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

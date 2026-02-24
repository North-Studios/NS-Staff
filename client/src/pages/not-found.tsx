import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <div className="flex items-center justify-center pt-24 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">{t("notFound.title")}</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("notFound.description")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

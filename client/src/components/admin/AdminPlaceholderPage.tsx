import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Todavía no está lista</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

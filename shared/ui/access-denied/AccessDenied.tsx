import Case from "@/shared/ui/case/Case";

export default function AccessDenied({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Case>
      <h1>Доступ к диску закрыт</h1>
      <p>{children}</p>
    </Case>
  );
}

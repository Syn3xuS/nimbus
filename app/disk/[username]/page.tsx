import Case from "@/shared/ui/case/Case";
import DiskClient from "./DiskClient";
import stylesCase from "@/shared/ui/case/Case_center.module.css";

import AccessDenied from "@/shared/ui/access-denied/AccessDenied";
import { requireDiskOwner } from "@/server/files/requireDiskOwner";

export default async function page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const result = await requireDiskOwner(username);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return <AccessDenied>Пользователь не найден.</AccessDenied>;
    }

    return <AccessDenied>Вы не имеете доступа к этому диску.</AccessDenied>;
  }

  return (
    <Case className={stylesCase.case_center}>
      <h1>Диск пользователя: {username}</h1>
      <DiskClient username={username} />
    </Case>
  );
}

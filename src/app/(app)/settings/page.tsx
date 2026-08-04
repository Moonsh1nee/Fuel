import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";

export default async function SettingsPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: { name: true },
  });

  return (
    <>
      <ProfileForm name={user?.name ?? null} />
      <PasswordForm />
    </>
  );
}

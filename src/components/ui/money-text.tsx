"use client";

import type { ComponentPropsWithoutRef, ElementType } from "react";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { formatIdr } from "@/lib/format";

type MoneyTextProps<T extends ElementType> = {
  as?: T;
  value: number;
  sign?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export function MoneyText<T extends ElementType = "span">({
  as,
  value,
  sign = "",
  ...props
}: MoneyTextProps<T>) {
  const { privacyEnabled } = usePrivacy();
  const Component = as ?? "span";

  return (
    <Component {...props}>
      {privacyEnabled ? "Rp••••••" : `${sign}${formatIdr(value)}`}
    </Component>
  );
}

export function PrivateText({
  value,
  masked = "••%",
}: {
  value: string;
  masked?: string;
}) {
  const { privacyEnabled } = usePrivacy();
  return <>{privacyEnabled ? masked : value}</>;
}

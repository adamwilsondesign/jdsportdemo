import type { Metadata } from "next";
import { FavouritesView } from "@/components/product/FavouritesView";

export const metadata: Metadata = { title: "Favourites" };

export default function FavouritesPage() {
  return <FavouritesView />;
}

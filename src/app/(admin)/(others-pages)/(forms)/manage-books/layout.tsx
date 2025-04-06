import { Metadata } from "next";
import ManageBooks from "./page";

export const metadata: Metadata = {
  title: "Manage Books | Bookstore Dashboard",
  description: "Manage your uploaded books",
};

export default function ManageBooksLayout() {
  return <ManageBooks />;
} 
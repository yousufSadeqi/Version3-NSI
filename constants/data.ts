import { CategoryType, ExpenseCategoriesType } from "@/types";
import { colors } from "./theme";

import * as Icons from "phosphor-react-native"; // Import all icons dynamically
export const expenseCategories: ExpenseCategoriesType = {
  groceries: {
    label: "Groceries",
    value: "groceries",
    icon: Icons.ShoppingCartSimple,
    bgColor: "#4B5563",
  },
  rent: {
    label: "Rent",
    value: "rent",
    icon: Icons.HouseLine,
    bgColor: "#075985",
  },
  utilities: {
    label: "Utilities",
    value: "utilities",
    icon: Icons.Plug,
    bgColor: "#ca8a04",
  },
  transportation: {
    label: "Transportation",
    value: "transportation",
    icon: Icons.CarSimple,
    bgColor: "#b45309",
  },
  entertainment: {
    label: "Entertainment",
    value: "entertainment",
    icon: Icons.TelevisionSimple,
    bgColor: "#0f766e",
  },
  dining: {
    label: "Dining",
    value: "dining",
    icon: Icons.Pizza,
    bgColor: "#be185d",
  },
  health: {
    label: "Health",
    value: "health",
    icon: Icons.FirstAid,
    bgColor: "#e11d48",
  },
  insurance: {
    label: "Insurance",
    value: "insurance",
    icon: Icons.ShieldPlus,
    bgColor: "#404040",
  },
  savings: {
    label: "Savings",
    value: "savings",
    icon: Icons.Coins,
    bgColor: "#065F46",
  },
  clothing: {
    label: "Clothing",
    value: "clothing",
    icon: Icons.Handbag,
    bgColor: "#7c3aed",
  },
  personal: {
    label: "Personal",
    value: "personal",
    icon: Icons.UserCircle,
    bgColor: "#a21caf",
  },
  shopping: {
    label: "Shopping",  
    value: "shopping",
    icon: Icons.ShoppingBag,  
    bgColor: "#D97706",  
  },
  others: {
    label: "Others",
    value: "others",
    icon: Icons.DotsThreeCircle,
    bgColor: "#525252",
  },
};

export const incomeCategory: CategoryType = {
  label: "Income",
  value: "income",
  icon: Icons.Wallet,
  bgColor: "#16a34a",
};

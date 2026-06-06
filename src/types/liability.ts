export type Liability = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  remaining_amount: number;
  due_date: string | null;
  reminder_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

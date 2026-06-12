'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateLocal } from '@/lib/db/month';

interface TransactionFormProps {
  onSubmit: (data: {
    transaction_date: string;
    description: string;
    amount: number;
    transaction_type: 'income' | 'expense';
    category_id: string;
    account_id?: string;
  }) => Promise<void>;
  categories: Array<{ id: string; name: string; tag: string }>;
  accounts?: Array<{ id: string; name: string; account_kind: string }>;
  initialValues?: {
    transaction_date?: string;
    description?: string;
    amount?: number;
    transaction_type?: 'income' | 'expense';
    category_id?: string;
    account_id?: string;
  };
  submitLabel?: string;
}

export function TransactionForm({
  onSubmit,
  categories,
  accounts = [],
  initialValues,
  submitLabel = 'Save Transaction',
}: TransactionFormProps) {
  /**
   * TIMEZONE SAFETY:
   * Default transaction_date to today's local calendar date using formatDateLocal.
   * This ensures a user entering a transaction on May 31st at 11pm in UTC-5
   * sees May 31st, not June 1st.
   * 
   * CRITICAL: Never use date.toISOString().substring(0, 10) here, as it
   * converts to UTC and can shift the calendar date.
   */
  const [transactionDate, setTransactionDate] = useState(
    initialValues?.transaction_date || formatDateLocal(new Date())
  );
  const [description, setDescription] = useState(initialValues?.description || '');
  const [amount, setAmount] = useState(initialValues?.amount?.toString() || '');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    initialValues?.transaction_type || 'expense'
  );
  const [categoryId, setCategoryId] = useState(initialValues?.category_id || '');
  const [accountId, setAccountId] = useState(initialValues?.account_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        transaction_date: transactionDate,
        description,
        amount: parseFloat(amount),
        transaction_type: transactionType,
        category_id: categoryId,
        account_id: accountId || undefined,
      });
    } catch (err: unknown) {
      console.error('Transaction form submission failed:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="transaction_date">Date</Label>
        <Input
          id="transaction_date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="transaction_type">Type</Label>
        <Select value={transactionType} onValueChange={(val) => setTransactionType(val as 'income' | 'expense')}>
          <SelectTrigger id="transaction_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="category_id">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger id="category_id">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {accounts.length > 0 && (
        <div>
          <Label htmlFor="account_id">Account (optional)</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id="account_id">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

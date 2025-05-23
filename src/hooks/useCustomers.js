import { useState } from 'react';

const useCustomers = (supabase, toast, session) => {
  const [customers, setCustomers] = useState([]);

  const addCustomer = async (customerData) => {
    if (!session) return null;
    const newCustomer = { ...customerData, id: `cust_${crypto.randomUUID()}` };
    const { data, error } = await supabase.from('customers').insert(newCustomer).select();
    if (error) {
      toast({ title: 'Error Adding Customer', description: error.message, variant: 'destructive' });
      return null;
    }
    if (data) {
      setCustomers(prev => [...prev, data[0]]);
      toast({ title: 'Customer Added', description: `${data[0].name} has been added.` });
      return data[0];
    }
    return null;
  };

  const updateCustomer = async (customerId, customerData) => {
    if (!session) return null;
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', customerId)
      .select();
    if (error) {
      toast({ title: 'Error Updating Customer', description: error.message, variant: 'destructive' });
      return null;
    }
    if (data) {
      setCustomers(prev => prev.map(c => (c.id === customerId ? data[0] : c)));
      toast({ title: 'Customer Updated', description: `${data[0].name} has been updated.` });
      return data[0];
    }
    return null;
  };

  const deleteCustomer = async (customerId) => {
    if (!session) return false;
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) {
      toast({ title: 'Error Deleting Customer', description: error.message, variant: 'destructive' });
      return false;
    }
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    toast({ title: 'Customer Deleted', description: `Customer has been deleted.` });
    return true;
  };

  return { customers, setCustomers, addCustomer, updateCustomer, deleteCustomer };
};

export default useCustomers;
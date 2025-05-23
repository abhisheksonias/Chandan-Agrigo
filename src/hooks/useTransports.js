import { useState } from 'react';

const useTransports = (supabase, toast, session) => {
  const [transports, setTransports] = useState([]);

  const addTransport = async (transportData) => {
    if (!session) return null;
    const newTransport = { ...transportData, id: `trans_${crypto.randomUUID()}` };
    const { data, error } = await supabase.from('transports').insert(newTransport).select();
    if (error) {
      toast({ title: 'Error Adding Transport', description: error.message, variant: 'destructive' });
      return null;
    }
    if (data) {
      setTransports(prev => [...prev, data[0]]);
      toast({ title: 'Transport Added', description: `${data[0].name} has been added.` });
      return data[0];
    }
    return null;
  };

  const updateTransport = async (transportId, transportData) => {
    if (!session) return null;
    const { data, error } = await supabase
      .from('transports')
      .update(transportData)
      .eq('id', transportId)
      .select();
    if (error) {
      toast({ title: 'Error Updating Transport', description: error.message, variant: 'destructive' });
      return null;
    }
    if (data) {
      setTransports(prev => prev.map(t => (t.id === transportId ? data[0] : t)));
      toast({ title: 'Transport Updated', description: `${data[0].name} has been updated.` });
      return data[0];
    }
    return null;
  };

  const deleteTransport = async (transportId) => {
    if (!session) return false;
    const { error } = await supabase.from('transports').delete().eq('id', transportId);
    if (error) {
      toast({ title: 'Error Deleting Transport', description: error.message, variant: 'destructive' });
      return false;
    }
    setTransports(prev => prev.filter(t => t.id !== transportId));
    toast({ title: 'Transport Deleted', description: `Transport provider has been deleted.` });
    return true;
  };

  return { transports, setTransports, addTransport, updateTransport, deleteTransport };
};

export default useTransports;
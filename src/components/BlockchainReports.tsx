import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Hash, Clock, CheckCircle, AlertCircle, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlockchainRecord {
  id: string;
  issueId: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: number;
  type: 'report' | 'update' | 'resolution';
}

// Simulated blockchain operations for demonstration
const simulateBlockchainTransaction = async (data: any): Promise<BlockchainRecord> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
  const mockBlock = Math.floor(Math.random() * 1000000) + 18500000;
  
  return {
    id: Date.now().toString(),
    issueId: data.issueId,
    transactionHash: mockHash,
    blockNumber: mockBlock,
    timestamp: new Date(),
    status: Math.random() > 0.1 ? 'confirmed' : 'failed',
    gasUsed: Math.floor(Math.random() * 50000) + 21000,
    type: data.type
  };
};

export default function BlockchainReports() {
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing blockchain records from localStorage
    const stored = localStorage.getItem('blockchain-records');
    if (stored) {
      setRecords(JSON.parse(stored));
    }
  }, []);

  const saveRecord = (record: BlockchainRecord) => {
    const updatedRecords = [...records, record];
    setRecords(updatedRecords);
    localStorage.setItem('blockchain-records', JSON.stringify(updatedRecords));
  };

  const submitToBlockchain = async (issueData: any) => {
    setIsSubmitting(true);
    
    try {
      toast({
        title: "Submitting to Blockchain",
        description: "Your report is being recorded on the blockchain...",
      });

      const record = await simulateBlockchainTransaction({
        issueId: issueData.id || Date.now().toString(),
        type: 'report',
        data: issueData
      });

      saveRecord(record);

      if (record.status === 'confirmed') {
        toast({
          title: "Blockchain Confirmation",
          description: `Report recorded on block ${record.blockNumber}`,
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: "Please try again later.",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Blockchain Error",
        description: "Failed to submit to blockchain.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      confirmed: "default",
      failed: "destructive", 
      pending: "secondary"
    };
    
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
          <Shield className="h-8 w-8" />
          Blockchain Transparency Dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          All civic reports are immutably recorded on the blockchain for complete transparency, 
          accountability, and tamper-proof evidence of government responsiveness.
        </p>
      </div>

      <Card className="shadow-elegant bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Blockchain Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-surface">
              <h3 className="font-semibold text-primary">Total Records</h3>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-surface">
              <h3 className="font-semibold text-primary">Confirmed</h3>
              <p className="text-2xl font-bold text-green-600">
                {records.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-surface">
              <h3 className="font-semibold text-primary">Success Rate</h3>
              <p className="text-2xl font-bold">
                {records.length > 0 
                  ? Math.round((records.filter(r => r.status === 'confirmed').length / records.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          <Button 
            onClick={() => submitToBlockchain({ 
              title: "Test Report", 
              category: "Municipal Corporation - Roads", 
              description: "Testing blockchain integration" 
            })}
            disabled={isSubmitting}
            className="w-full bg-gradient-primary hover:shadow-glow"
          >
            {isSubmitting ? "Submitting to Blockchain..." : "Test Blockchain Submission"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">Blockchain Transaction History</h2>
        
        {records.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No blockchain records found. Submit a report to get started.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {records.reverse().map((record) => (
              <Card key={record.id} className="shadow-soft hover:shadow-hover transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <h3 className="font-semibold">Block #{record.blockNumber}</h3>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Transaction Hash</p>
                      <p className="font-mono flex items-center gap-2">
                        {formatHash(record.transactionHash)}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Link className="h-3 w-3" />
                        </Button>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Timestamp</p>
                      <p>{record.timestamp.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="capitalize">{record.type}</p>
                    </div>
                    
                    {record.gasUsed && (
                      <div>
                        <p className="text-muted-foreground">Gas Used</p>
                        <p>{record.gasUsed.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="shadow-elegant bg-gradient-card">
        <CardHeader>
          <CardTitle>Benefits of Blockchain Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Immutable Records</h4>
                  <p className="text-sm text-muted-foreground">
                    Reports cannot be altered or deleted once recorded
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Full Transparency</h4>
                  <p className="text-sm text-muted-foreground">
                    All transactions are publicly verifiable
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Decentralized Trust</h4>
                  <p className="text-sm text-muted-foreground">
                    No single authority controls the records
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Audit Trail</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete history of all report activities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
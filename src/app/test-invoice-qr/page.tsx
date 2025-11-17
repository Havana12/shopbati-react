'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestInvoiceQRPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testInvoiceGeneration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Test data matching OrderData interface
      const testOrderData = {
        orderId: `TEST-${Date.now()}`,
        timestamp: new Date().toISOString(),
        customerName: 'Client Test',
        customerEmail: 'test@shopbati.fr',
        items: [
          {
            name: 'Ciment Portland',
            quantity: 10,
            price: 15.50,
            reference: 'SB001234'
          },
          {
            name: 'Briques Rouge',
            quantity: 50,
            price: 2.30,
            reference: 'SB001235'
          }
        ],
        total: 324.00,
        isProfessional: false,
        shippingAddress: {
          street: '123 Rue de Test',
          postalCode: '75001',
          city: 'Paris',
          country: 'France'
        }
      }

      console.log('Sending test data:', testOrderData)

      const response = await fetch('/api/invoice-qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOrderData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate invoice')
      }

      console.log('Invoice generated successfully:', data)
      setResult(data)
    } catch (err: any) {
      console.error('Error generating invoice:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Test Invoice with QR Code
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This page allows you to test the invoice generation with QR code and Appwrite storage.
            </p>
            <p className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
              <strong>Note:</strong> Make sure you have created the "invoices" bucket in Appwrite before testing.
            </p>
          </div>

          <button
            onClick={testInvoiceGeneration}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Invoice...
              </span>
            ) : (
              'Generate Test Invoice'
            )}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-green-800 font-semibold mb-4 text-xl">✅ Invoice Generated Successfully!</h3>
              
              <div className="space-y-4">
                <div className="bg-white rounded p-4 border border-green-100">
                  <h4 className="font-semibold text-gray-800 mb-2">Invoice Details:</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>File ID:</strong> {result.fileId}</li>
                    <li><strong>Status:</strong> {result.message}</li>
                  </ul>
                </div>

                <div className="bg-white rounded p-4 border border-green-100">
                  <h4 className="font-semibold text-gray-800 mb-2">Invoice Link:</h4>
                  <div className="space-y-2">
                    <a
                      href={result.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:text-blue-800 underline text-sm break-all"
                    >
                      📄 View/Download Invoice PDF
                    </a>
                  </div>
                </div>

                {result.qrCodeDataUrl && (
                  <div className="bg-white rounded p-4 border border-green-100">
                    <h4 className="font-semibold text-gray-800 mb-2">QR Code:</h4>
                    <img 
                      src={result.qrCodeDataUrl} 
                      alt="Invoice QR Code" 
                      className="w-48 h-48 mx-auto border border-gray-300 rounded"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Scan this QR code with your phone to download the invoice directly
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Go to your Appwrite Console</li>
              <li>Navigate to Storage section</li>
              <li>Create a new bucket named "invoices"</li>
              <li>Set permissions to allow public read access</li>
              <li>Come back here and click "Generate Test Invoice"</li>
            </ol>
          </div>

          <div className="mt-6">
            <Link 
              href="/"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

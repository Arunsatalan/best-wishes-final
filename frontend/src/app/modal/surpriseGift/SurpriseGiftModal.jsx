"use client";
import React, { useRef, useState } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";

const SurpriseGift = ({ onClose, onConfirm, itemsCount = 1, deliveryFee = 0, discounts = 0, estimateTotal = 0, confirmLoading = false }) => {
  const modalRef = useRef(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} ref={modalRef}>
        <div className='flex-col p-[24px] rounded-[12px] space-y-[16px]'>
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-[18px] font-semibold text-[#111827]'>Confirm Surprise Gift Application</p>
              <p className='text-[13px] text-[#6B7280] mt-[2px]'>Please review the steps before applying</p>
            </div>
            <button onClick={onClose} className='text-[#6B7280] hover:text-black'>
              <IoIosCloseCircleOutline className='text-[26px]' />
            </button>
          </div>
          <div className='rounded-[10px] bg-[#F9FAFB] p-[14px] text-[14px] text-[#374151] space-y-[6px] border border-[#E5E7EB]'>
            <p className='font-semibold'>How it works</p>
            <ul className='list-disc pl-[18px] space-y-[2px]'>
              <li>You apply with your details.</li>
              <li>Our admin team reviews and confirms your request.</li>
              <li>After confirmation, you will proceed with payment and we handle the rest.</li>
            </ul>
          </div>
          <div className='grid grid-cols-2 gap-[12px] text-[14px]'>
            <div className='flex justify-between items-center bg-[#FCFCFD] border border-[#F3F4F6] rounded-[8px] px-[10px] py-[8px]'>
              <p className='text-[#6B7280]'>Total items</p>
              <p className='text-[#111827] font-semibold'>{itemsCount}</p>
            </div>
            <div className='flex justify-between items-center bg-[#FCFCFD] border border-[#F3F4F6] rounded-[8px] px-[10px] py-[8px]'>
              <p className='text-[#6B7280]'>Delivery Fee</p>
              <p className='text-[#111827] font-semibold'>US {Number(deliveryFee).toFixed(2)}£</p>
            </div>
            <div className='flex justify-between items-center bg-[#FCFCFD] border border-[#F3F4F6] rounded-[8px] px-[10px] py-[8px]'>
              <p className='text-[#6B7280]'>Discounts</p>
              <p className='text-green-600 font-semibold'>US {Number(discounts).toFixed(2)}£</p>
            </div>
            <div className='flex justify-between items-center bg-[#FCFCFD] border border-[#F3F4F6] rounded-[8px] px-[10px] py-[8px]'>
              <p className='text-[#6B7280]'>Estimate Total</p>
              <p className='text-[#111827] font-semibold'>US {Number(estimateTotal).toFixed(2)}£</p>
            </div>
          </div>
          <div className='flex items-start text-[14px] gap-[10px]'>
            <input id='ack' type='checkbox' className='mt-[2px] w-[18px] h-[18px] rounded-[3px] border border-[#D1D5DB]' checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            <label htmlFor='ack' className='text-[#111827] font-semibold'>I have read and understood the steps above.</label>
          </div>
          <div className='w-full flex gap-[10px] pt-[4px]'>
            <button onClick={onClose} className='h-[44px] w-[35%] text-[16px] border-2 border-[#822BE2] text-[#822BE2] font-semibold rounded-[8px] hover:cursor-pointer bg-white hover:bg-purple-50'>Cancel</button>
            <button disabled={!acknowledged || confirmLoading} onClick={onConfirm} className={`h-[44px] w-[65%] text-[16px] text-white font-semibold rounded-[8px] hover:cursor-pointer ${(!acknowledged || confirmLoading) ? 'bg-purple-400 cursor-not-allowed' : 'bg-[#822BE2] hover:bg-purple-600'}`}>
              {confirmLoading ? 'Applying...' : 'Confirm & Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurpriseGift;

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    width: '92%',
    maxWidth: '560px',
    // textAlign: 'center',
    position: 'relative',
  }
};

'use client'
import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const DropdownList = ({
  options,
  selectedOption,
  onOptionSelect,
  triggerElement
}: DropdownListProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleOptionClick = (option: string) => {
    onOptionSelect(option)
    setIsOpen(false)
  }
  return (
    <div className="relative">
      <div className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {triggerElement}
        {/*<div className="filter-trigger">*/}
        {/*  <figure>*/}
        {/*    <Image src="/assets/icons/hamburger.svg" alt="menu" width={14} height={14}/>*/}
        {/*    More recent*/}
        {/*  </figure>*/}
        {/*  <Image src="/assets/icons/arrow-down.svg" alt="arrow-down" width={20} height={20}/>*/}
        {/*</div>*/}
      </div>
      {isOpen && (
        <ul className="dropdown">
          {/*{['Most recent', 'Most liked'].map((option) => (*/}
          {options.map(option => (
            <li
              key={option}
              className={cn('list-item', {
                'bg-pink-100 text-white': selectedOption === option
              })}
              onClick={() => handleOptionClick(option)}
            >
              {option}
              {selectedOption === option && (
                <Image
                  src="/assets/icons/check.svg"
                  alt="check"
                  width={16}
                  height={16}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DropdownList

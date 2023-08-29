
#include "umalloc.h"

//Place any variables needed here from umalloc.c as an extern.
extern memory_block_t *free_head;

/*
 * check_heap -  used to check that the heap is still in a consistent state.
 * Required to be completed for checkpoint 1.
 * Should return 0 if the heap is still consistent, otherwise return a non-zero
 * return code. Asserts are also a useful tool here.
 */
int check_heap() {
    // Example heap check:

    // Check that all blocks in the free list are marked free.
    // If a block is marked allocated, return -1.
    memory_block_t *cur = free_head;
    //Iterate through free list/
    while (cur) {
        if (is_allocated(cur)) {
            //Block is marked as allocated but is in free list. 
            return -1;
        } else {
            cur = get_next(cur);
        }
    }


    //Check if all blocks are at the correct alignment

    cur = free_head;
    //Iterate through free list.
    while(cur){
        //if the size of the entire block is not 16-byte aligned, return -1
        if(get_size(cur) % 16 != 0){
            return -1;
        } else {
            cur = get_next(cur);
        }
    }


    //Check if all blocks in free list are pointing to valid free blocks

    cur = free_head;
    //Iterate through free list.
    while(cur) {
        if(cur->next != NULL){
            if(is_allocated(cur->next)){
                //Next pointer is pointing to an invalid (allocated) block, so return -1. 
                //Next pointer must only point to a free block.
                return -1;
            }
        }
        cur = get_next(cur);
    }


    //Check that all items in free list are in order.

    memory_block_t *prev = free_head;
    cur = free_head->next;
    //Iterate through free list.
    while(cur){
        //If address of current is smaller than prev, the list is out of order.
        //If list is out of order, return -1.
        if(cur < prev){
            return -1;
        }
        cur = get_next(cur);
    }
    
    return 0;
} 
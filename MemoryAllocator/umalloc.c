#include "umalloc.h"
#include "csbrk.h"
#include "ansicolors.h"
#include <stdio.h>
#include <assert.h>

const char author[] = ANSI_BOLD ANSI_COLOR_RED "Rohil Verma rbv299" ANSI_RESET;

/*
    HEADER COMMENT:

    My memory blocks have a size value, a next pointer, a prev pointer, and padding (which is an int pointer).
    I added a prev pointer to establish a doubly-linked free list, which makes coalescing and removing items
    from the free list easier. I added the padding to ensure that the header of the memory block will always be
    16-byte aligned. Moreover, the size value in my header includes the size of the payload as well as the
    size of the header (size = payload + sizeof(memory_block_type)). 

    My free list is a doubly-linked list of memory blocks that is kept in order. In other words, a memory block's 
    address will belarger than all the memory blocks preceding it in the list. The beginning of the free list is 
    defined as "free_head", which is a pointer to a memory block. The free_head will never have a previous value as
    it is at the beginning of the list.

    My allocator uses a combination of splitting and coalescing to manipulate the free list. Once a block is allocated,
    if the size of the block used is larger than the size inputted to allocate, the leftover space is split. The large free
    block gets divided up into a smaller free block and an allocated block. In my design, I set the new allocated block 
    to be the right hand side of the initial large free block and the new free block to be the left hand side of the 
    initial large free block. This way, there is no need to update the free list as I am essentially "shortening" the
    larger free block and the free list remains intact. Moreover, once a block is freed, my design checks its neighboring
    free blocks to check if they can be coalesced, or combined into a larger free block. I also check for coalescing when
    I extend, in the case that the new memory received from csbrk is contiguous with the end of the free list.
*/




/*
 * The following helpers can be used to interact with the memory_block_t
 * struct, they can be adjusted as necessary.
 */

// A sample pointer to the start of the free list.
memory_block_t *free_head;

/*
 * is_allocated - returns true if a block is marked as allocated.
 */
bool is_allocated(memory_block_t *block) {
    assert(block != NULL);
    return block->block_size_alloc & 0x1;
}

/*
 * allocate - marks a block as allocated.
 */
void allocate(memory_block_t *block) {
    assert(block != NULL);
    block->block_size_alloc |= 0x1;
}


/*
 * deallocate - marks a block as unallocated.
 */
void deallocate(memory_block_t *block) {
    assert(block != NULL);
    block->block_size_alloc &= ~0x1;
}

/*
 * get_size - gets the size of the block.
 */
size_t get_size(memory_block_t *block) {
    assert(block != NULL);
    return block->block_size_alloc & ~(ALIGNMENT-1);
}

/*
 * get_next - gets the next block.
 */
memory_block_t *get_next(memory_block_t *block) {
    assert(block != NULL);
    return block->next;
}

/*
 *  get_prev - gets the previous block.
 */
memory_block_t *get_prev(memory_block_t *block) {
    assert(block != NULL);
    return block->prev;
}

/*
 * set_head - sets a new free_head block, nulls out previous value since head is first in list.
 */

void set_head(memory_block_t *block) {
    block->prev = NULL;
    free_head = block;
}

/*
 * put_block - puts a block struct into memory at the specified address.
 * Initializes the size and allocated fields, along with NUlling out the next 
 * field.
 */
void put_block(memory_block_t *block, size_t size, bool alloc) {
    assert(block != NULL);
    assert(size % ALIGNMENT == 0);
    assert(alloc >> 1 == 0);
    block->block_size_alloc = size | alloc;
    block->next = NULL;
}

/*
 * get_payload - gets the payload of the block.
 */
void *get_payload(memory_block_t *block) {
    assert(block != NULL);
    return (void*)(block + 1);
}

/*
 * get_block - given a payload, returns the block.
 */
memory_block_t *get_block(void *payload) {
    assert(payload != NULL);
    return ((memory_block_t *)payload) - 1;
}

/*
 * valid_coalesce - check if two blocks meet the requirements to be coalesced.
 * Requirements: must be contiguous in memory and must both be free blocks.
 */

bool valid_coalesce(memory_block_t *blockOne, memory_block_t *blockTwo){
    //Must check if contiguous in memory.
    if((memory_block_t *)((char *) blockOne + get_size(blockOne)) == blockTwo){
        return true;
    }
    return false;
}

/*
 * set_next - sets the next value of a memory block.
*/
void set_next(memory_block_t* cur, memory_block_t* next){
    cur->next = next;
}

/*
 * The following are helper functions that can be implemented to assist in your
 * design, but they are not required. 
 */

/*
 * find - finds a free block that can satisfy the umalloc request, allocates it, and splits if necessary.
 */
memory_block_t *find(size_t size) {
    if(size == 0){
        return NULL;
    }
    memory_block_t *freeCurrent = free_head;

    //Iterate through free list to find first free block of memory
    while(freeCurrent){
        if((freeCurrent->block_size_alloc - sizeof(memory_block_t) < size) | (is_allocated(freeCurrent))){
            freeCurrent = get_next(freeCurrent);
        } else {
            if(get_size(freeCurrent) == size){

                //If found block is first
                if(freeCurrent == free_head){
                    //If found block is only block in free list, extend
                    if(!(freeCurrent->next)){
                        free_head = extend(PAGESIZE);
                    } else {
                        //Remove found block from free list
                        freeCurrent->next->prev = NULL;
                        free_head = free_head->next;
                    }
                } else {
                    //Found block is not first, remove it from the list
                    if(freeCurrent->prev){
                        freeCurrent->prev->next = freeCurrent->next;
                    }
                    if(freeCurrent->next){
                        freeCurrent->next->prev = freeCurrent->prev;
                    }
                }

                //Set field values of freeCurrent
                put_block(freeCurrent, get_size(freeCurrent), true);
                return(freeCurrent);
            } else {
                //Not a perfect fit, split the remaining free space.
                return(split(freeCurrent, size));
            }
        }
    }

    //No sufficient free blocks available, return NULL to malloc for handling.
    return NULL;
}

/*
 * extend - extends the heap if more memory is required.
 */
memory_block_t *extend(size_t size) {
    int sizeAligned = ALIGN(size);
    //Go to end of free list
    memory_block_t *currFree = free_head;
    while(currFree->next){
        currFree = get_next(currFree);
    }

    //Call csbrk, get new memory, and initialize the fields.
    memory_block_t *newMem = (memory_block_t *) csbrk(sizeAligned);
    newMem->block_size_alloc = sizeAligned;
    deallocate(newMem);

    //Add new memory to free list
    newMem->prev = currFree;
    currFree->next = newMem;
    if(valid_coalesce(currFree, newMem)){
        put_block(currFree, get_size(currFree) + get_size(newMem), false);
    }

    return newMem;
}

/*
 * split - splits a given block in parts, one allocated, one free. Returns a pointer to the allocated block,
 */
memory_block_t *split(memory_block_t *block, size_t size) {

    //MAKING RIGHT SIDE OF FREE BLOCK THE NEW ALLOCATED BLOCK
    
    //Create new block for allocation. 
    memory_block_t *newAlloc = (memory_block_t *) ((char *) block + block->block_size_alloc - size);
    newAlloc->block_size_alloc = size;
    allocate(newAlloc);

    //Update size of free block. Free list will remain in tact as initial free block reference is the same.
    block->block_size_alloc = block->block_size_alloc - size;
    return newAlloc;
}

/*
 * coalesce - coalesces a free memory block with neighbors.
 */
memory_block_t* coalesce() {
    return NULL;
}


/*
 * uinit - Used initialize metadata required to manage the heap
 * along with allocating initial memory.
 */
int uinit() {
    //Get initial memory from csbrk and set beginning of free list.
    free_head = (memory_block_t *) csbrk(PAGESIZE);
    if(free_head == NULL){
        return -1; 
    }
    //Set fields of free_head;
    free_head->block_size_alloc = PAGESIZE;
    free_head->next = NULL;
    free_head->prev = NULL;
    deallocate(free_head);
    return 0;
}

/*
 * umalloc -  allocates size bytes and returns a pointer to the allocated memory.
 */
void *umalloc(size_t size) {

    if(size <= 0){
        return NULL;
    }

    //Adjust size to match alignment requirements and find free block.
    int sizeAligned = ALIGN(size + sizeof(memory_block_t));
    memory_block_t *curAllocated = find(sizeAligned);


    if(curAllocated == NULL){
        // If no free block found, need more space in heap.
        curAllocated = extend(16 * PAGESIZE);
        //Split extra space.
        curAllocated = split(curAllocated, sizeAligned);
        curAllocated->next = NULL;
        curAllocated->prev = NULL;
        return(get_payload(curAllocated));
    } else {
        curAllocated->next = NULL;
        curAllocated->prev = NULL;
        return(get_payload(curAllocated));   
    }

    return NULL;
}

/*
 * ufree -  frees the memory space pointed to by ptr, which must have been called
 * by a previous call to malloc.
 */
void ufree(void *ptr) {

    //Deallocate the block
    memory_block_t *block = get_block((memory_block_t *) ptr);
    if(!(is_allocated(block))){
        return;
    }
    deallocate(block);

    memory_block_t *currFree = NULL;
    memory_block_t *prevFree = NULL;


    //Must place back in free list at the right place address to make coalescing possible.

    if(free_head == NULL){
        //If no items in free list, set block to head.
        free_head = block;
        block->prev = NULL;
        block->next = NULL;
    } else {
        prevFree = free_head;
        currFree = prevFree->next;
        if(block < prevFree){
            //If block's address is before the head, make block new head.
            block->next = prevFree;
            prevFree->prev = block;
            free_head = block;
            free_head->prev = NULL;
        } else if(currFree == NULL){
            //If block's address is after head and there is only one item in list, set next of head to block.
            free_head->next = block;
            block->prev = free_head;
            free_head->prev = NULL;
        } else {
            //Edge cases handled, must loop through to find correct spot to place
            while(currFree){
                if(block > prevFree && block < currFree){
                    //Found place for block, update previous and next values.
                    prevFree->next = block;
                    block->prev = prevFree;
                    block->next = currFree;              
                    currFree->prev = block;
                    break;
                }
                //Place not found, move forward in list.
                prevFree = currFree;
                currFree = currFree->next;
            }
            //At this point, block must be placed after all items in the list.
            prevFree->next = block;
        }
    }

    if(block == free_head){
        //If block is only item in list, no coalescing possible.
        return;
    }

    // Coalesce if possible
    if(prevFree && block < prevFree){
        //Block was placed before prevFree and prevFree exists
        if(valid_coalesce(block, prevFree)){
            block->block_size_alloc = get_size(block) + get_size(prevFree);
            if(prevFree->next){
                prevFree->next->prev = block;
            }
            block->next = prevFree->next;
        }

        //Coalesced block and prevFree, now must check if currFree exists and is valid to coalesce.
        if(currFree){
            if(valid_coalesce(block, currFree)){
                block->block_size_alloc = get_size(block) + get_size(currFree);
                if(currFree->next){
                    currFree->next->prev = block;
                    
                }
                block->next = currFree->next;
            }
        }
    } else {
        //Block was placed after prevFree.

        //Check if prevFree and block can be coalesced
        if(valid_coalesce(prevFree, block)){
            prevFree->block_size_alloc = get_size(prevFree) + get_size(block);
            //Update references
            if(block->next){
                block->next->prev = prevFree;
            }
            prevFree->next = block->next;
        }

        if(currFree){
            //Check if prevFree and currFree can be coalesced
            if(valid_coalesce(prevFree, currFree)){
                prevFree->block_size_alloc = get_size(prevFree) + get_size(currFree);
                //Update references
                if(currFree->next){
                    currFree->next->prev = prevFree;
                }
                prevFree->next = currFree->next;
            }
        }
    }
}
import { authClient } from '@/auth/client'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Upload } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export const UserForm = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState<string>()
    const [imageUrl, setImageUrl] = useState<string>()
    const { data: authSession } = authClient.useSession()

    const updateUserProfile = async () => {
        setIsLoading(true)
        try {
            await authClient.updateUser({ name, image: imageUrl })
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/r2/upload', {
                method: 'POST',
                body: formData,
            })

            const data = (await response.json()) as { id: string }
            if (data?.id) {
                setImageUrl(`/images/${data.id}/thumbnail.webp`)
            }
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    useEffect(() => {
        if (authSession?.user) {
            setName(authSession.user.name || '')
            setImageUrl(authSession.user.image || '')
        }
    }, [authSession])

    return (
        <Drawer>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent className='max-w-screen-sm mx-auto rounded-none'>
                <DrawerHeader>
                    <DrawerTitle>User Information</DrawerTitle>
                    <DrawerDescription className='flex flex-col gap-3'>
                        <div className='flex flex-col items-center gap-4'>
                            <Avatar className='h-24 w-24'>
                                <AvatarImage src={imageUrl || undefined} alt={name} />
                                <AvatarFallback className='text-2xl'>{getInitials(name || '')}</AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col items-center gap-2'>
                                <Label htmlFor='image-upload' className='cursor-pointer'>
                                    <div className='flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground'>
                                        <Upload className='h-4 w-4' />
                                        <span>이미지 업로드</span>
                                    </div>
                                </Label>
                                <Input id='image-upload' type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
                                <p className='text-xs text-muted-foreground'>JPG, PNG 또는 GIF (최대 2MB)</p>
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='name'>이름</Label>
                            <Input
                                id='name'
                                type='text'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder='이름을 입력하세요'
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='email'>이메일</Label>
                            <Input id='email' type='email' value={authSession?.user?.email || ''} disabled className='bg-muted cursor-not-allowed' />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='image-url'>이미지 URL</Label>
                            <Input
                                disabled
                                className='bg-muted cursor-not-allowed'
                                id='image-url'
                                type='url'
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder='https://example.com/image.jpg'
                            />
                        </div>
                    </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                    <Button onClick={updateUserProfile} disabled={isLoading}>
                        {isLoading ? '저장 중' : '저장'}
                    </Button>
                    <DrawerClose asChild>
                        <Button variant='outline'>닫기</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

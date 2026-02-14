import React, {useState, useEffect} from "react";
import { supabase } from "./supabaseClient";
import { useParams, Link } from "react-router-dom";
import {
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, Text, Textarea, Divider, HStack
} from '@chakra-ui/react';

export default function Profile() {
    const { id } = useParams();
    const toast = useToast();

    const [profile, setProfile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            // ログインユーザーの情報を取得
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            //URLのIDに該当する人のプロフィールを取得
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                setProfile(data);
                setEditName(data.username);
                setEditBio(data.bio || '');
            }
        };
        fetchProfile();
    }, [id]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({ username: editName, bio: editBio })
            .eq('id', id);

        if ( error ) {
            toast({
                title: 'プロフィールの更新に失敗しました',
                status: 'error',
            });
        } else {
            toast({
                title: 'プロフィールを更新しました',
                status: 'success',
                duration: 2000,
            });
            setProfile({ ...profile, username: editName, bio: editBio });  
            setIsEditing(false);
        }
        setLoading(false);
    };

    if (!profile) {
        return <Container maxW="container.md" py={8}><Text>プロフィールが見つかりませんでした</Text></Container>;
    }
    
    const isMyProfile = currentUser && currentUser.id === profile.id;

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={6} align="stretch">

                <Box>
                    <Button as={Link} to="/" variant ="ghost" colorScheme="blue" size="sm">
                        ホームに戻る
                    </Button>
                </Box>

                <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
                    {isMyProfile ? (
                        <Box as="form" onSubmit={handleUpdateProfile}>
                            <VStack spacing={4}>
                                <Heading size="md">プロフィール編集</Heading>
                                <FormControl>
                                    <FormLabel>ユーザー名</FormLabel>
                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>自己紹介</FormLabel>
                                    <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={6} placeholder="自己紹介を入力してください"/>
                                </FormControl>
                                <HStack spacing={4} w={"full"}>
                                    <Button type="submit" colorScheme="blue" flex={1} isLoading={loading}>保存</Button>
                                    <Button onClick={() => setIsEditing(false)} variant="outline" flex={1} isDisabled={loading}>キャンセル</Button>
                                </HStack>
                            </VStack>
                        </Box>
                    ) : (
                        <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="lg">{profile.username} さんのページ</Heading>
                
                {/* 自分のページを見ている時だけ「編集する」ボタンを出す */}
                {isMyProfile && (
                  <Button size="sm" colorScheme="blue" variant="outline" onClick={() => setIsEditing(true)}>
                    編集する
                  </Button>
                )}
              </HStack>
              <Divider />
              <Box>
                <Text fontWeight="bold" color="gray.600" mb={2}>自己紹介</Text>
                <Text whiteSpace="pre-wrap">
                  {profile.bio ? profile.bio : 'まだ自己紹介がありません。'}
                </Text>
              </Box>
            </VStack>
          )}
        </Box>
      </VStack>
    </Container>
  );
}
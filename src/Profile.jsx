// src/Profile.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useParams, Link, useLocation } from 'react-router-dom'; // ★ useLocation を追加
import {
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, Text, Textarea, Divider, HStack
} from '@chakra-ui/react';

export default function Profile() {
  const { id } = useParams(); 
  const location = useLocation(); // ★ 前の画面から渡されたデータを受け取る
  const toast = useToast();

  // ★ 渡されたデータ(名前)があれば、それを初期状態としてセットしておく（これで「読み込み中」をスキップできます）
  const [profile, setProfile] = useState(location.state || null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(location.state?.username || '');
  const [editBio, setEditBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      // ★ 対策1：Promise.all を使って、2つの通信を「同時に（並列で）」スタートさせる
      const [authResponse, profileResponse] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('profiles').select('*').eq('id', id).single()
      ]);

      const user = authResponse.data.user;
      const profileData = profileResponse.data;

      if (user) setCurrentUser(user);

      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.username);
        setEditBio(profileData.bio || ''); 
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

// ... (前略)
    if (error) {
      toast({ title: 'エラー', description: '更新に失敗しました', status: 'error' });
    } else {
      toast({ title: '成功', description: 'プロフィールを更新しました', status: 'success', duration: 3000 });
      setProfile({ ...profile, username: editName, bio: editBio });
      setIsEditing(false); 
      
      // ▼▼▼ ★追加：自分のプロフィールを更新した場合は、ブラウザの記憶も最新に書き換える ▼▼▼
      if (isMyProfile) {
        localStorage.setItem('my_username', editName);
      }
      // ▲▲▲
    }
    setLoading(false);
  };

  if (!profile) return <Container py={10}><Text>読み込み中...</Text></Container>;

  const isMyProfile = currentUser && currentUser.id === id;

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={6} align="stretch">
        
        <Box>
            <Button as={Link} to="/" variant="ghost" colorScheme="blue" size="sm">
                ← ホームに戻る
            </Button>
        </Box>

        <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
          {isEditing ? (
            <Box as="form" onSubmit={handleUpdateProfile}>
              <VStack spacing={4}>
                <Heading size="md">プロフィール編集</Heading>
                <FormControl isRequired>
                  <FormLabel>名前</FormLabel>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>自己紹介</FormLabel>
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={6} placeholder="自己紹介を書いてみましょう！" />
                </FormControl>
                <HStack spacing={4} w="full">
                  <Button type="submit" colorScheme="blue" flex={1} isLoading={loading}>保存する</Button>
                  <Button onClick={() => setIsEditing(false)} flex={1} variant="outline" isDisabled={loading}>キャンセル</Button>
                </HStack>
              </VStack>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="lg">{profile.username} さんのページ</Heading>
                
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
                  {/* 先渡しされたデータの時はbioがまだ無いので、取得が終わるまで薄い文字で待機させます */}
                  {profile.bio !== undefined ? (profile.bio || 'まだ自己紹介がありません。') : <Text color="gray.400">読み込み中...</Text>}
                </Text>
              </Box>
            </VStack>
          )}
        </Box>
      </VStack>
    </Container>
  );
}